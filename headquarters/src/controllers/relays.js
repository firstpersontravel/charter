const moment = require('moment');

const config = require('../config');
const models = require('../models');

class RelaysController {
  static async getOutgoingRelayService(orgId, experienceId) {
    // First look for dedicated relay service
    const serviceWithEntryway = models.RelayService.findOne({
      where: {
        stage: config.env.HQ_STAGE,
        isActive: true
      },
      includes: {
        model: models.RelayEntryway,
        where: {
          orgId: orgId,
          experienceId: experienceId
        }
      }
    });
    if (serviceWithEntryway) {
      return serviceWithEntryway;
    }
    // Then look for shared one
    return models.RelayService.findOne({
      where: {
        stage: config.env.HQ_STAGE,
        isActive: true,
        isShared: true
      }
    });
  }

  /**
   * Make sure a relay exists for a given spec
   */
  static async ensureRelay(orgId, experienceId, tripId, relaySpec, forPhoneNumber) {
    // Get relay if it exists, either for everyone or for this participant.
    const relayFields = {
      stage: config.env.HQ_STAGE,
      orgId: orgId,
      experienceId: experienceId,
      tripId: tripId,
      forPhoneNumber: forPhoneNumber,
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
    const outgoingRelayService = await this.getOutgoingRelayService();
    if (!outgoingRelayService) {
      return null;
    }

    return await models.Relay.create(Object.assign({}, relayFields, {
      relayPhoneNumber: outgoingRelayService.phoneNumber,
      messagingServiceId: outgoingRelayService.sid,
      lastActiveAt: moment.utc()
    }));
  }

  static async createRelayFromIncoming(relayService, relayEntryway, relaySpec, trip, fromNumber) {
    return await models.Relay.create({
      stage: config.env.HQ_STAGE,
      orgId: relayEntryway.orgId,
      experienceId: relayEntryway.experienceId,
      tripId: trip.id,
      forPhoneNumber: fromNumber,
      forRoleName: relaySpec.for,
      withRoleName: relaySpec.with,
      asRoleName: relaySpec.as || relaySpec.for,
      relayPhoneNumber: relayService.phoneNumber,
      messagingServiceId: relayService.sid,
      lastActiveAt: moment.utc()
    });
  }

  /**
   * Find a relay by its number and a participant number.
   */
  static async findByNumber(relayNumber, forNumber) {
    return await models.Relay.findOne({
      where: {
        stage: config.env.HQ_STAGE,
        relayPhoneNumber: relayNumber,
        forPhoneNumber: forNumber
      },
      order: [
        // Find the relay with the most recent activity
        ['lastActiveAt', 'DESC']
      ],
    });
  }
}

module.exports = RelaysController;
