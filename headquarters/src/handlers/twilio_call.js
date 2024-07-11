const _ = require('lodash');
const twilio = require('twilio');
const moment = require('moment');

const config = require('../config');
const models = require('../models');
const KernelController = require('../kernel/kernel');
const NotifyController = require('../controllers/notify');
const RelayController = require('../controllers/relay');
const TwilioUtil = require('./twilio_util');
const TwilioCallOps = require('./twilio_call_ops');
const TwilioCallUtil = require('./twilio_call_util');

class TwilioCallHandler {
  /**
   * Interpret a single twiml event.
   */
  static async _interpretTwimlEvent(tripId, relay, twimlRes, twimlOp) {
    const twimlFunc = TwilioCallOps[twimlOp.clause];
    if (!twimlFunc) {
      throw new Error('Could not identify twiml op.');
    }
    await twimlFunc.call(TwilioCallOps, tripId, relay, twimlRes, twimlOp);
  }

  /**
   * Interpret multiple twiml events.
   */
  static async _interpretTwimlOps(tripId, relay, twimlOps) {
    const twimlRes = new twilio.twiml.VoiceResponse();
    for (let twimlOp of twimlOps) {
      await this._interpretTwimlEvent(tripId, relay, twimlRes, twimlOp);
    }
    return twimlRes;
  }

  /**
   * Trigger an event in the system and gather twiml from the response.
   */
  static async _triggerEventAndGatherTwiml(tripId, relay, event) {
    const result = await KernelController.applyEvent(tripId, event);
    await NotifyController.notifyEvent(tripId, event);
    const twimlOps = _.filter(result.resultOps, { operation: 'twiml' });
    const twimlResult = await this._interpretTwimlOps(tripId, relay, twimlOps);
    return twimlResult;
  }

  /**
   * Interrupt a call, for if we have a new action during a partial response.
   */
  static async _interruptCall(callSid, twiml) {
    if (!config.getTwilioClient()) {
      return;
    }
    const twilioHost = config.env.HQ_TWILIO_HOST;
    const twimlBase64 = encodeURIComponent(
      Buffer.from(twiml.toString()).toString('base64'));
    const url = (
      `${twilioHost}/endpoints/twilio/calls/interrupt` + 
      `?twiml=${twimlBase64}`
    );
    return await config
      .getTwilioClient()
      .calls(callSid)
      .update({ url: url });
  }

  static async handleIncomingCall(fromNumber, toNumber) {
    const relay = await TwilioUtil.getRelayForExistingOrNewTrip(toNumber, fromNumber, null);
    if (!relay) {
      return TwilioCallUtil.say('No Charter relay found for this number.');
    }

    const script = await RelayController.scriptForRelay(relay);
    const relaySpec = RelayController.specForRelay(script, relay);
    if (!relaySpec) {
      return TwilioCallUtil.say('No Charter relay spec found for this number.');
    }

    await relay.update({
      lastActiveAt: moment.utc()
    });

    const event = {
      type: 'call_received',
      from: relay.asRoleName,
      to: relay.withRoleName
    };
    const twimlRes = await this._triggerEventAndGatherTwiml(relay.tripId, relay,
      event);
    // If we have a response, then return it
    if (twimlRes.response.children.length > 0) {
      return twimlRes;
    }
    // Otherwise, return a default warning.
    return TwilioCallUtil.say('No Charter behavior handled this incoming call.');
  }

  static async handleOutgoingCall(relayId, tripId, answeredByHuman) {
    const relay = await models.Relay.findByPk(relayId);
    if (!relay) {
      return TwilioCallUtil.hangup();
    }
    const event = {
      type: 'call_answered',
      from: relay.withRoleName,
      to: relay.asRoleName,
      answered_by_machine: !answeredByHuman
    };
    const twimlRes = await this._triggerEventAndGatherTwiml(tripId, relay,
      event);
    if (twimlRes.response.children.length > 0) {
      return twimlRes;
    }
    // Otherwise, return a default warning.
    return TwilioCallUtil.say('No Charter behavior handled this outgoing call.');
  }

  static async handleCallResponse(relayId, tripId, callSid, clipName,
    speechResult, isPartial) {
    // Do nothing with query type right now
    const event = {
      type: 'clip_answered',
      clip: clipName,
      partial: isPartial,
      response: speechResult
    };
    const relay = await models.Relay.findByPk(relayId);
    const twimlRes = await this._triggerEventAndGatherTwiml(tripId, relay,
      event);

    if (isPartial) {
      // If we're partial, only respond if we get a signal from the script
      if (twimlRes.response.children.length > 0) {
        // If this is a partial response, and we have any twiml to respond
        // to, then we can't just return it -- we need to interrupt the
        // call in progress. TODO!
        await this._interruptCall(callSid, twimlRes);
      }
      // Either way, don't return twiml synchronously.
      return new twilio.twiml.VoiceResponse();
    }

    // If we're a final response, we need a response
    if (twimlRes.response.children.length > 0) {
      return twimlRes;
    }
    // No response to a final response, hang up.
    return TwilioCallUtil.hangup();
  }

  static async handleCallEnded(relayId, tripId) {
    const relay = await models.Relay.findByPk(relayId);
    const event = {
      type: 'call_ended',
      roles: [relay.withRoleName, relay.asRoleName]
    };
    return await this._triggerEventAndGatherTwiml(tripId, relay, event);
  }
}

module.exports = TwilioCallHandler;
