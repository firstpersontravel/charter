const Sequelize = require('sequelize');

const config = require('../config');
const models = require('../models');

const logger = config.logger.child({ name: 'controllers.relays' });

const MESSAGING_SERVICES_BY_STAGE = {
  test: {
    relayPhoneNumber: '+13334445555',
    messagingServiceId: 'MG1234'
  },
  production: {
    relayPhoneNumber: '+12762902593',
    messagingServiceId: 'MGf67465fa393f01c9b8e322c12721c03c'
  }
};

class RelaysController {
  /**
   * Purchase a new number.
   */
  static async purchaseNumber(areaCode) {
    // First try in desired area code
    let availableNumbers = await config
      .getTwilioClient()
      .availablePhoneNumbers('US')
      .local
      .list(areaCode ? { areaCode: areaCode } : {});
    // If an area code was specified and none available, try anywhere
    if (areaCode && !availableNumbers.length) {
      availableNumbers = await config
        .getTwilioClient()
        .availablePhoneNumbers('US')
        .local
        .list();
    }
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
    return updatedNumber.phoneNumber;
  }

  /**
   * Return either an allocated or purchased relay phone number for a given participant.
   */
  static assignRelayPhoneNumber() {
    return MESSAGING_SERVICES_BY_STAGE[config.env.HQ_STAGE];
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
    const {relayPhoneNumber, messagingServiceId} = RelaysController.assignRelayPhoneNumber();
    // Return null if we couldn't allocate a phone number -- due to no twilio
    // client.
    if (!relayPhoneNumber) {
      return null;
    }
    // And create the relay.
    return await models.Relay.create(Object.assign({}, relayFields, {
      relayPhoneNumber: relayPhoneNumber,
      messagingServiceId: messagingServiceId,
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
