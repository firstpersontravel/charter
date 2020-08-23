const _ = require('lodash');
const Sentry = require('@sentry/node');

const config = require('../config');
const models = require('../models');

const logger = config.logger.child({ name: 'controllers.relay' });

const whitelistedNumbers = [
  '+19144844223',
  '+19178213078',
  '+15556667777' // for testing
];

class RelayController {
  /**
   * Find script for relay
   */
  static async scriptForRelay(relay) {
    return await models.Script.findOne({
      where: {
        isActive: true,
        isArchived: false
      },
      include: [{
        model: models.Org,
        as: 'org',
        where: { id: relay.orgId }
      }, {
        model: models.Experience,
        as: 'experience',
        where: { id: relay.experienceId }
      }]
    });
  }

  /**
   * Find a spec for a given relay.
   */
  static specForRelay(script, relay) {
    return _.find(script.content.relays, r => (
      r.for === relay.forRoleName &&
      r.with === relay.withRoleName &&
      (r.as || r.for) === relay.asRoleName
    )) || null;
  }

  /**
   * Find sibling relays with the supplied 'as' and 'with' values.
   */
  static async findSiblings(relay, asRoleName, withRoleName) {
    return await models.Relay.findAll({
      where: {
        stage: config.env.HQ_STAGE,
        experienceId: relay.experienceId,
        tripId: relay.tripId,
        withRoleName: withRoleName,
        asRoleName: asRoleName,
        isActive: true
      }
    });
  }

  /**
   * Get player for the "for" role for this relay and a given participant phone
   * number.
   */
  static async lookupPlayer(relay, participantNumber) {
    // If we found an existing matching player with this number,
    // then we're good -- return it -- even if this is an entryway because
    // that means a specific participant has already been assigned.
    return await models.Player.findOne({
      where: { roleName: relay.forRoleName },
      include: [{
        model: models.Participant,
        as: 'participant',
        where: { phoneNumber: participantNumber }
      }, {
        model: models.Trip,
        as: 'trip',
        where: {
          experienceId: relay.experienceId,
          isArchived: false
        },
      }]
    });
  }

  /**
   * Initiate a call.
   */
  static async initiateCall(relay, toPlayer, detectVoicemail) {
    // Only call if we have a twilio client
    if (!config.getTwilioClient()) {
      return;
    }
    // Needs a participant and phone number.
    const toParticipant = await toPlayer.getParticipant();
    if (!toParticipant || !toParticipant.phoneNumber) {
      logger.warn(`Relay ${relay.id} has no participant phone number.`);
      return;
    }
    // Protection in non-production from texting anyone who is not Gabe.
    if (!config.isTesting &&
        config.env.HQ_STAGE !== 'production' &&
        !_.includes(whitelistedNumbers, toParticipant.phoneNumber)) {
      logger.warn(`Relay ${relay.id} is not to a whitelisted number.`);
      return;
    }
    const twilioHost = config.env.HQ_TWILIO_HOST;
    const callOpts = {
      to: toParticipant.phoneNumber,
      from: relay.relayPhoneNumber,
      machineDetection: detectVoicemail ? 'detectMessageEnd' : 'enable',
      url: (
        `${twilioHost}/endpoints/twilio/calls/outgoing` +
        `?trip=${toPlayer.tripId}&relay=${relay.id}`
      ),
      method: 'POST',
      statusCallback: (
        `${twilioHost}/endpoints/twilio/calls/status` + 
        `?trip=${toPlayer.tripId}&relay=${relay.id}`
      ),
      statusCallbackMethod: 'POST'
    };
    return await config.getTwilioClient().calls.create(callOpts);
  }

  /**
   * Send a message through twilio.
   */
  static async sendMessage(relay, trip, body, mediaUrl) {
    // Skip if twilio isn't active.
    if (!config.getTwilioClient()) {
      return;
    }
    // Skip inactive relays.
    if (!relay.isActive) {
      return;
    }
    // Don't do anything if a blank message.
    if (!body && !mediaUrl) {
      return;
    }
    // Figure out which role to send the message to. This won't be the same
    // as the message's sendTo since a relay can, say, forward Sarai's messages
    // to the TravelAgent as well.
    const toPlayer = await models.Player.findOne({
      where: { tripId: trip.id, roleName: relay.forRoleName },
      include: [{ model: models.Participant, as: 'participant' }]
    });
    if (!_.get(toPlayer, 'participant.phoneNumber')) {
      return;
    }
    const toPhoneNumber = toPlayer.participant.phoneNumber;
    // Protection in non-production from texting anyone who is not Gabe.
    if (config.env.HQ_STAGE !== 'production' &&
        !_.includes(whitelistedNumbers, toPhoneNumber)) {
      return;
    }
    const opts = Object.assign(
      { to: toPhoneNumber, from: relay.relayPhoneNumber },
      body ? { body: body } : null,
      mediaUrl ? { mediaUrl: mediaUrl } : null
    );
    logger.info(opts, 'Sending twilio message');
    try {
      await config.getTwilioClient().messages.create(opts);
    } catch(err) {
      if (err.code === 21614 ||  // Not a mobile number
          err.code === 21610) {  // Unsubscribed
        return;
      }
      // Unreachable -- maybe trying to message a US number from an international number
      if (err.code === 21612) {
        logger.warn(opts, err.message);
        return;
      }
      // Capture exception and continue
      Sentry.captureException(err);
    }
  }
}

module.exports = RelayController;
