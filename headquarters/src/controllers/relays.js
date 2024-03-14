const config = require('../config');
const models = require('../models');

class RelaysController {
  /**
   * Make sure a relay exists for a given spec
   */
  static async ensureRelay(orgId, experienceId, relaySpec) {
    // Get relay if it exists, either for everyone or for this participant.
    const relayFields = {
      stage: config.env.HQ_STAGE,
      orgId: orgId,
      experienceId: experienceId,
      forRoleName: relaySpec.for,
      withRoleName: relaySpec.with,
      asRoleName: relaySpec.as || relaySpec.for
    };
    // Return relay if it exists
    const existingRelay = await models.Relay.findOne({ where: relayFields });
    if (existingRelay) {
      return existingRelay;
    }

    // And create the relay.
    const { relayPhoneNumber, messagingServiceId } = config.getGlobalMessagingServiceInfo();

    return await models.Relay.create(Object.assign({}, relayFields, {
      relayPhoneNumber: relayPhoneNumber,
      messagingServiceId: messagingServiceId,
      isActive: true
    }));
  }

  /**
   * Find a relay by its number and a participant number.
   */
  static async findByNumber(relayNumber) {
    return await models.Relay.findOne({
      where: {
        stage: config.env.HQ_STAGE,
        relayPhoneNumber: relayNumber,
        isActive: true
      }
    });
  }
}

module.exports = RelaysController;
