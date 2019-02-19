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
      .list({ areaCode: '707' });
    if (!availableNumbers.length) {
      throw new Error('No numbers available for purchase.');
    }
    const availableNumber = availableNumbers[0];
    const purchasedNumber = await config
      .getTwilioClient()
      .incomingPhoneNumbers
      .create({ phoneNumber: availableNumber.phoneNumber });

    const twilioHost = config.env.TWILIO_HOST;
    const updatedNumber = await purchasedNumber.update({
      voiceUrl: `${twilioHost}/endpoints/twilio/calls/incoming`,
      statusCallback: `${twilioHost}/endpoints/twilio/calls/incoming_status`,
      smsUrl: `${twilioHost}/endpoints/twilio/messages/incoming`
    });
    logger.warn(`Purchased ${updatedNumber.phoneNumber}.`);
    return updatedNumber.phoneNumber.replace('+1', '');
  }

  /**
   * Return either an allocated or purchased relay phone number for a given user.
   */
  static async assignRelayPhoneNumber(userPhoneNumber) {
    const twilioClient = config.getTwilioClient();
    if (!twilioClient) {
      return null;
    }
    // Find existing numbers for this environment.
    const allExistingNumbers = await twilioClient.incomingPhoneNumbers.list();
    const envExistingNumbers = _(allExistingNumbers)
      .filter(num => num.smsUrl.indexOf(config.env.TWILIO_HOST) === 0)
      .map(num => num.phoneNumber.replace('+1', ''))
      .value();
    let overlaps;
    if (userPhoneNumber === '') {
      // If we're trying to create a new trailhead, don't overlap with
      // anything at all.
      overlaps = {};
    } else {
      // If we're assigning a number for a specific user, then find all global
      // relays or relays for that user, and ensure we don't overlap.
      overlaps = {
        userPhoneNumber: { [Sequelize.Op.or]: ['', userPhoneNumber] }
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
  static async ensureRelay(orgId, experienceId, departureName, relaySpec,
    userNum) {
    // Get relay if it exists, either for everyone or for this user.
    const relayFields = {
      stage: config.env.STAGE,
      orgId: orgId,
      experienceId: experienceId,
      departureName: departureName,
      forRoleName: relaySpec.for,
      withRoleName: relaySpec.with,
      asRoleName: relaySpec.as || relaySpec.for,
      userPhoneNumber: userNum
    };
    // Return relay if it exists
    const existingRelay = await models.Relay.find({ where: relayFields });
    if (existingRelay) {
      return existingRelay;
    }
    // If it doesn't we'll need to create it! Allocate a new number.
    const relayPhoneNumber = await (
      RelaysController.assignRelayPhoneNumber(userNum)
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
   * Find a relay by its number and a user number.
   */
  static async findByNumber(relayNumber, userNum) {
    return await models.Relay.find({
      where: {
        stage: config.env.STAGE,
        relayPhoneNumber: relayNumber,
        userPhoneNumber: { [Sequelize.Op.or]: ['', userNum] },
        isActive: true
      }
    });
  }
}

module.exports = RelaysController;
