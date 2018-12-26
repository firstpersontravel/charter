const _ = require('lodash');

const config = require('../config');
const models = require('../models');

const logger = config.logger.child({ name: 'controllers.relay' });

const whitelistedNumbers = [
  '9144844223',
  '9178213078',
  // '4802440810'
];

class RelayController {
  /**
   * Find script for relay
   */
  static async scriptForRelay(relay) {
    return await models.Script.find({
      where: {
        name: relay.scriptName,
        isActive: true,
        isArchived: false
      }
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
        stage: config.env.STAGE,
        scriptName: relay.scriptName,
        departureName: relay.departureName,
        withRoleName: withRoleName,
        asRoleName: asRoleName,
        isActive: true
      }
    });
  }

  /**
   * Get player for the "for" role for this relay and a given user phone
   * number.
   */
  static async lookupPlayer(relay, userNumber) {
    // If we found an existing matching player with this number,
    // then we're good -- return it -- even if this is a trailhead because
    // that means a specific user has already been assigned.
    return await models.Player.find({
      where: { roleName: relay.forRoleName },
      include: [{
        model: models.User,
        as: 'user',
        where: { phoneNumber: userNumber }
      }, {
        model: models.Trip,
        as: 'trip',
        where: { departureName: relay.departureName, isArchived: false },
        include: [{
          model: models.Script,
          as: 'script',
          where: { name: relay.scriptName }
        }]
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
    // Needs a user and phone number.
    const toUser = await toPlayer.getUser();
    if (!toUser || !toUser.phoneNumber) {
      logger.warn(`Relay ${relay.id} has no user phone number.`);
      return;
    }
    // Protection in non-production from texting anyone who is not Gabe.
    if (!config.isTesting &&
        config.env.STAGE !== 'production' &&
        !_.includes(whitelistedNumbers, toUser.phoneNumber)) {
      logger.warn(`Relay ${relay.id} is not to a whitelisted number.`);
      return;
    }
    const twilioHost = config.env.TWILIO_HOST;
    const callOpts = {
      to: `+1${toUser.phoneNumber}`,
      from: `+1${relay.relayPhoneNumber}`,
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
    const toPlayer = await models.Player.find({
      where: { tripId: trip.id, roleName: relay.forRoleName },
      include: [{ model: models.User, as: 'user' }]
    });
    if (!_.get(toPlayer, 'user.phoneNumber')) {
      return;
    }
    const toPhoneNumber = toPlayer.user.phoneNumber;
    // Protection in non-production from texting anyone who is not Gabe.
    if (config.env.STAGE !== 'production' &&
        !_.includes(whitelistedNumbers, toPhoneNumber)) {
      return;
    }
    const opts = Object.assign(
      { to: `+1${toPhoneNumber}`, from: `+1${relay.relayPhoneNumber}`},
      body ? { body: body } : null,
      mediaUrl ? { mediaUrl: mediaUrl } : null
    );
    logger.info(opts, 'Sending twilio message');
    try {
      await config.getTwilioClient().messages.create(opts);
    } catch(err) {
      throw new Error(`Error sending twilio message: ${err.message}`);
    }
  }
}

module.exports = RelayController;
