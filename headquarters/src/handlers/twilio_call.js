const _ = require('lodash');
const twilio = require('twilio');

const config = require('../config');
const models = require('../models');
const TripActionController = require('../controllers/trip_action');
const TripNotifyController = require('../controllers/trip_notify');
const RelayController = require('../controllers/relay');
const RelaysController = require('../controllers/relays');
const TwilioUtil = require('./twilio_util');
const TwilioCallOps = require('./twilio_call_ops');
const TwilioCallUtil = require('./twilio_call_util');

var logger = config.logger.child({ name: 'handlers.twilio_call' });

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
    const result = await TripActionController.applyEvent(tripId, event);
    await TripNotifyController.notifyEvent(tripId, event);
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
    const twilioHost = config.env.TWILIO_HOST;
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
    const relay = await RelaysController.findByNumber(toNumber, fromNumber);
    if (!relay) {
      // Relay not found
      logger.warn('Relay not found.');
      return TwilioCallUtil.hangup();
    }

    const script = await RelayController.scriptForRelay(relay);
    const relaySpec = RelayController.specForRelay(script, relay);
    if (!relaySpec) {
      logger.warn(`Relay ${relay.id} does not have a spec.`);
      return TwilioCallUtil.hangup();
    }

    // Lookup the trip id or create one.
    const tripId = await TwilioUtil.lookupOrCreateTripId(relay, fromNumber);
    if (!tripId) {
      // If we couldn't create one, probably cos its not a trailhead.
      return TwilioCallUtil.hangup();
    }

    const event = {
      type: 'call_received',
      from: relay.asRoleName,
      to: relay.withRoleName
    };
    const twimlRes = await this._triggerEventAndGatherTwiml(tripId, relay,
      event);
    // If we have a response, then return it
    if (twimlRes.response.children.length > 0) {
      return twimlRes;
    }
    // Otherwise, return the auto voicemail.
    logger.error('No twiml events generated by incoming call.');
    return TwilioCallUtil.hangup();
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
    if (twimlRes.response.children.length === 0) {
      logger.error('No twiml events generated by outgoing call.');
      return TwilioCallUtil.hangup();
    }
    return twimlRes;
  }

  static async handleCallResponse(relayId, tripId, callSid, queryName,
    queryType, speechResult, isPartial) {
    // Do nothing with query type right now
    const event = {
      type: 'query_responded',
      query: queryName,
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
    if (twimlRes.response.children.length === 0) {
      logger.error(`No twiml generated by final response to ${queryName}.`);
      return TwilioCallUtil.hangup();
    }
    return twimlRes;
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
