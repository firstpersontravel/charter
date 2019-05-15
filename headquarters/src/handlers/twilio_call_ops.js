const config = require('../config');
const models = require('../models');
const RelayController = require('../controllers/relay');
const TwilioCallUtil = require('./twilio_call_util');

var logger = config.logger.child({ name: 'handlers.twilio_call_ops' });

class TwilioCallOps {
  static async dial(tripId, relay, twimlResponse, twimlOp) {
    // finding the opposite relay, so "as" = to, and "with" = from
    const dialRelays = await RelayController.findSiblings(
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
      include: [{ model: models.User, as: 'user' }]
    });
    if (!dialPlayer) {
      logger.warn(`Dial player ${twimlOp.toRoleName} not found.`);
      return TwilioCallUtil.hangup();
    }
    if (!dialPlayer.user) {
      logger.warn('Dial target user not found.');
      return TwilioCallUtil.hangup();
    }
    if (!dialPlayer.user.phoneNumber) {
      logger.warn(
        `Dial target user ${dialPlayer.userId} has no phone number.`
      );
      return TwilioCallUtil.hangup();
    }
    const dial = twimlResponse.dial({
      callerId: `+1${dialRelay.relayPhoneNumber}`,
      timeout: 30
    });
    dial.number(`+1${dialPlayer.user.phoneNumber}`);
    twimlResponse.say('We\'re sorry, this number could not be reached.');
  }

  static async say(tripId, relay, twimlResponse, twimlOp) {
    twimlResponse.say({ voice: twimlOp.voice }, twimlOp.message);
  }

  static async play(tripId, relay, twimlResponse, twimlOp) {
    const script = await RelayController.scriptForRelay(relay);
    const mediaUrl = TwilioCallUtil.getTwilioMediaPath(
      script.experience.name, twimlOp.media);
    twimlResponse.play({}, mediaUrl);
  }

  static async gather(tripId, relay, twimlResponse, twimlOp) {
    const twilioHost = config.env.TWILIO_HOST;
    const gather = twimlResponse.gather(Object.assign({
      input: 'dtmf speech',
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

module.exports = TwilioCallOps;
