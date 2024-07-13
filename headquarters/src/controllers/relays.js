const moment = require('moment');

const config = require('../config');
const models = require('../models');

const RelayController = require('./relay');

class RelaysController {
  static getDefaultWelcome() {
    return 'Welcome to Charter! You will receive text messages based on the experience you joined. Text STOP to end or HELP for info.';
  }

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
   * Make sure a relay exists for a given spec for outgoing messages.
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

    // Can't create a relay if there is no outgoing service -- this should always return
    // something as long as there is a default production service.
    const outgoingRelayService = await this.getOutgoingRelayService();
    if (!outgoingRelayService) {
      return null;
    }

    // Create the new relay
    const newRelay = await models.Relay.create(Object.assign({}, relayFields, {
      relayPhoneNumber: outgoingRelayService.phoneNumber,
      messagingServiceId: outgoingRelayService.sid,
      lastActiveAt: moment.utc()
    }));

    // Get the entryway if it exists, to load custom welcome message
    const outgoingRelayEntryway = await models.RelayEntryway.findOne({
      relayServiceId: outgoingRelayService.id,
      orgId: orgId,
      experienceId: experienceId
    });
    
    // Send welcome message for new relays
    await this.sendWelcome(outgoingRelayEntryway, newRelay);

    // And return
    return newRelay;
  }

  static async sendWelcome(relayEntryway, relay) {
    // Send entryway welcome message via new relay
    const welcome = (relayEntryway && relayEntryway.welcome) || this.getDefaultWelcome();
    await RelayController.sendMessage(relay, welcome);
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
      include: [{
        model: models.Trip,
        where: { isArchived: false },
        as: 'trip'
      }],
      order: [
        // Find the relay with the most recent activity
        ['lastActiveAt', 'DESC']
      ],
    });
  }
}

module.exports = RelaysController;
