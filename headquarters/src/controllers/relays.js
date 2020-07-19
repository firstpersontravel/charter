const _ = require('lodash');
const Sequelize = require('sequelize');

const config = require('../config');
const models = require('../models');

const logger = config.logger.child({ name: 'controllers.relays' });

class RelaysController {
  /**
   * Purchase a new number.
   */
  static async purchaseNumber() {
    const availableNumbers = await config
      .getTwilioClient()
      .availablePhoneNumbers('US')
      .local
      .list();
    if (!availableNumbers.length) {
      throw new Error('No numbers available for purchase.');
    }
    const availableNumber = availableNumbers[0];
    const purchasedNumber = await config
      .getTwilioClient()
      .incomingPhoneNumbers
      .create({ phoneNumber: availableNumber.phoneNumber });

    const twilioHost = config.env.HQ_TWILIO_HOST;
    const updatedNumber = await purchasedNumber.update({
      voiceUrl: `${twilioHost}/endpoints/twilio/calls/incoming`,
      statusCallback: `${twilioHost}/endpoints/twilio/calls/incoming_status`,
      smsUrl: `${twilioHost}/endpoints/twilio/messages/incoming`
    });
    logger.warn(`Purchased ${updatedNumber.phoneNumber}.`);
    return updatedNumber.phoneNumber.replace('+1', '');
  }

  /**
   * Return either an allocated or purchased relay phone number for a given participant.
   */
  static async assignRelayPhoneNumber(participantPhoneNumber) {
    const twilioClient = config.getTwilioClient();
    if (!twilioClient) {
      return null;
    }
    // Find existing numbers for this environment.
    const allExistingNumbers = await twilioClient.incomingPhoneNumbers.list();
    const envExistingNumbers = _(allExistingNumbers)
      .filter(num => num.smsUrl.indexOf(config.env.HQ_TWILIO_HOST) === 0)
      .map(num => num.phoneNumber.replace('+1', ''))
      .value();
    let overlaps;
    if (participantPhoneNumber === '') {
      // If we're trying to create a new entryway, don't overlap with
      // anything at all.
      overlaps = {};
    } else {
      // If we're assigning a number for a specific participant, then find all global
      // relays or relays for that participant, and ensure we don't overlap.
      overlaps = {
        participantPhoneNumber: { [Sequelize.Op.or]: ['', participantPhoneNumber] }
      };
    }
    const existingRelays = await models.Relay.findAll({ where: overlaps });

    // Look through existing numbers for one that is available.
    for (const envExistingNumber of envExistingNumbers) {
      // If there are no existing relays with this relay number, then it's
      // available to be assigned.
      if (!_.find(existingRelays, { relayPhoneNumber: envExistingNumber })) {
        return envExistingNumber;
      }
    }
    // If we get here, all existing numbers are taken. Let's purchase a new one!
    return await RelaysController.purchaseNumber();
  }

  /**
   * Make sure a relay exists for a given spec
   */
  static async ensureRelay(orgId, experienceId, tripId, relaySpec, participantPhoneNumber) {
    // Get relay if it exists, either for everyone or for this participant.
    const relayFields = {
      stage: config.env.HQ_STAGE,
      orgId: orgId,
      experienceId: experienceId,
      tripId: tripId,
      forRoleName: relaySpec.for,
      withRoleName: relaySpec.with,
      asRoleName: relaySpec.as || relaySpec.for,
      participantPhoneNumber: participantPhoneNumber
    };
    // Return relay if it exists
    const existingRelay = await models.Relay.findOne({ where: relayFields });
    if (existingRelay) {
      return existingRelay;
    }
    // If it doesn't we'll need to create it! Allocate a new number.
    const relayPhoneNumber = await (
      RelaysController.assignRelayPhoneNumber(participantPhoneNumber)
    );
    // Return null if we couldn't allocate a phone number -- due to no twilio
    // client.
    if (!relayPhoneNumber) {
      return null;
    }
    // And create the relay.
    return await models.Relay.create(Object.assign({}, relayFields, {
      relayPhoneNumber: relayPhoneNumber,
      isActive: true
    }));
  }

  /**
   * Find a relay by its number and a participant number.
   */
  static async findByNumber(relayNumber, participantPhoneNumber) {
    return await models.Relay.findOne({
      where: {
        stage: config.env.HQ_STAGE,
        relayPhoneNumber: relayNumber,
        participantPhoneNumber: { [Sequelize.Op.or]: ['', participantPhoneNumber] },
        isActive: true
      }
    });
  }
}

module.exports = RelaysController;
