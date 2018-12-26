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
    // Find all relays that are either global or for this user -- that's what
    // we can't overlap.
    const existingRelays = await models.Relay.findAll({
      where: {
        userPhoneNumber: { [Sequelize.Op.or]: ['', userPhoneNumber] }
      }
    });
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
  static async ensureRelay(scriptName, departureName, relaySpec, userNumber) {
    // Get relay if it exists, either for everyone or for this user.
    const relayFields = {
      stage: config.env.STAGE,
      scriptName: scriptName,
      departureName: departureName,
      forRoleName: relaySpec.for,
      withRoleName: relaySpec.with,
      asRoleName: relaySpec.as || relaySpec.for,
      userNumber: userNumber
    };
    // Return relay if it exists
    const existingRelay = await models.Relay.find({ where: relayFields });
    if (existingRelay) {
      return existingRelay;
    }
    // If it doesn't we'll need to create it! Allocate a new number.
    const relayPhoneNumber = await (
      RelaysController.assignRelayPhoneNumber(userNumber)
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
   * Create trailhead relays.
   */
  static async ensureTrailheadsForScriptName(scriptName) {
    // Get active script by name
    const script = await models.Script.find({
      where: { name: scriptName, isActive: true, isArchived: false }
    });
    // Create only trailhead relays
    const trailheadRelays = _.filter(script.content.relays, { trailhead: true });
    for (let departure of script.content.departures) {
      for (let relaySpec of trailheadRelays) {
        await RelaysController.ensureRelay(script.name, departure.name,
          relaySpec, '');
      }
    }
  }

  /**
   * Find a relay by its number and a user number.
   */
  static async findByNumber(relayNumber, userNumber) {
    return await models.Relay.find({
      where: {
        stage: config.env.STAGE,
        relayPhoneNumber: relayNumber,
        userPhoneNumber: { [Sequelize.Op.or]: ['', userNumber] },
        isActive: true
      }
    });
  }
}

module.exports = RelaysController;
