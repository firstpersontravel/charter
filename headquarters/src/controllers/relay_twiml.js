const _ = require('lodash');
const twilio = require('twilio');
const config = require('../config.ts');
const models = require('../models');
const TwilioCallUtil = require('../handlers/twilio_call_util');

var logger = config.logger.child({ name: 'controllers.relay_twiml' });

class RelayTwimlController {
  /**
   * Find sibling relays with the supplied 'as' and 'with' values.
   */
  static async _findSiblings(relay, asRoleName, withRoleName) {
    return await models.Relay.findAll({
      where: {
        stage: config.env.HQ_STAGE,
        tripId: relay.tripId,
        withRoleName: withRoleName,
        asRoleName: asRoleName
      }
    });
  }

  /**
   * Interpret a single twiml event.
   */
  static async _interpretTwimlEvent(tripId, relay, twimlRes, twimlOp) {
    const twimlFunc = this[twimlOp.clause];
    if (!twimlFunc) {
      throw new Error('Could not identify twiml op.');
    }
    await twimlFunc.call(this, tripId, relay, twimlRes, twimlOp);
  }

  /**
   * Interpret multiple twiml events.
   */
  static async interpretTwimlOps(tripId, relay, twimlOps) {
    const twimlRes = new twilio.twiml.VoiceResponse();
    for (let twimlOp of twimlOps) {
      await this._interpretTwimlEvent(tripId, relay, twimlRes, twimlOp);
    }
    return twimlRes;
  }

  static async dial(tripId, relay, twimlResponse, twimlOp) {
    // finding the opposite relay, so "as" = to, and "with" = from
    const dialRelays = await this._findSiblings(
      relay, twimlOp.toRoleName, twimlOp.fromRoleName);
    if (dialRelays.length === 0) {
      logger.warn(
        `Dial relay from ${twimlOp.fromRoleName} ` +
        `to ${twimlOp.toRoleName} not found.`
      );
      return TwilioCallUtil.hangup();
    }
    const dialRelay = dialRelays[0];

    // Find the active player
    const dialPlayer = await models.Player.findOne({
      where: { tripId: tripId, roleName: twimlOp.toRoleName },
      include: [{ model: models.Participant, as: 'participant' }]
    });
    if (!dialPlayer) {
      logger.warn(`Dial player ${twimlOp.toRoleName} not found.`);
      return TwilioCallUtil.hangup();
    }
    if (!dialPlayer.participant) {
      logger.warn('Dial target participant not found.');
      return TwilioCallUtil.hangup();
    }
    if (!dialPlayer.participant.phoneNumber) {
      logger.warn(
        `Dial target participant ${dialPlayer.participantId} has no phone number.`
      );
      return TwilioCallUtil.hangup();
    }
    const dial = twimlResponse.dial({
      callerId: dialRelay.relayPhoneNumber,
      timeout: 30
    });
    dial.number(dialPlayer.participant.phoneNumber);
    twimlResponse.say('We\'re sorry, this number could not be reached.');
  }

  static async say(tripId, relay, twimlResponse, twimlOp) {
    twimlResponse.say({ voice: twimlOp.voice }, twimlOp.message);
  }

  static async play(tripId, relay, twimlResponse, twimlOp) {
    twimlResponse.play({}, twimlOp.media);
  }

  static async gather(tripId, relay, twimlResponse, twimlOp) {
    const twilioHost = config.env.HQ_TWILIO_HOST;
    const gather = twimlResponse.gather(Object.assign({
      input: 'dtmf speech',
      timeout: 10,
      speechTimeout: 5,
      action: (
        `${twilioHost}/endpoints/twilio/calls/response` +
        `?relay=${relay.id}&trip=${tripId}&clip=${twimlOp.clipName}`
      ),
      partialResultCallback: (
        `${twilioHost}/endpoints/twilio/calls/response` +
        `?relay=${relay.id}&trip=${tripId}&clip=${twimlOp.clipName}` +
        '&partial=true'
      )
    }, twimlOp.hints ? { hints: twimlOp.hints } : null));
    // Interpret the subclause and add it to the gather clause.
    const subOp = twimlOp.subclause.clause;
    await this[subOp].call(this, tripId, relay, gather, twimlOp.subclause);
  }
}

module.exports = RelayTwimlController;

