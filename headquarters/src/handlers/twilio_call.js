const _ = require('lodash');
const twilio = require('twilio');

const config = require('../config');
const models = require('../models');
const TripActionController = require('../controllers/trip_action');
const TripNotifyController = require('../controllers/trip_notify');
const RelayController = require('../controllers/relay');
const RelaysController = require('../controllers/relays');
const TwilioUtil = require('./twilio_util');

var logger = config.logger.child({ name: 'handlers.twilio' });

function hangup() {
  const response = new twilio.twiml.VoiceResponse();
  response.hangup();
  return response;
}

async function interpretTwimlDial(tripId, relay, twimlResponse, twimlOp) {
  // finding the opposite relay, so "as" = to, and "with" = from
  const dialRelays = await RelayController.findSiblings(
    relay, twimlOp.toRoleName, twimlOp.fromRoleName);
  if (dialRelays.length === 0) {
    logger.warn(
      `Dial relay from ${twimlOp.fromRoleName} ` +
      `to ${twimlOp.toRoleName} not found.`
    );
    return hangup();
  }
  const dialRelay = dialRelays[0];

  // Find the active participant
  const dialParticipant = await models.Participant.find({
    where: { tripId: tripId, roleName: twimlOp.toRoleName },
    include: [{ model: models.User, as: 'user' }]
  });
  if (!dialParticipant) {
    logger.warn(`Dial participant ${twimlOp.toRoleName} not found.`);
    return hangup();
  }
  if (!dialParticipant.user) {
    logger.warn('Dial target user not found.');
    return hangup();
  }
  if (!dialParticipant.user.phoneNumber) {
    logger.warn(
      `Dial target user ${dialParticipant.userId} has no phone number.`
    );
    return hangup();
  }
  const dial = twimlResponse.dial({
    callerId: `+1${dialRelay.relayPhoneNumber}`,
    timeout: 30
  });
  dial.number(`+1${dialParticipant.user.phoneNumber}`);
  twimlResponse.say('We\'re sorry, this number could not be reached.');
}

async function interpretTwimlSay(tripId, relay, twimlResponse, twimlOp) {
  twimlResponse.say({ voice: twimlOp.voice }, twimlOp.message);
}

function twilioPathForRelayAndMedia(script, mediaPath) {
  const mediaHost = config.env.TWILIO_MEDIA_HOST;
  return `${mediaHost}/${script.name}/${mediaPath}`;
}

async function interpretTwimlPlay(tripId, relay, twimlResponse, twimlOp) {
  const script = await RelayController.scriptForRelay(relay);
  const mediaUrl = twilioPathForRelayAndMedia(script, twimlOp.media);
  twimlResponse.play({}, mediaUrl);
}

async function interpretTwimlGather(tripId, relay, twimlResponse, twimlOp) {
  const twilioHost = config.env.TWILIO_HOST;
  // build gather
  const args = {
    input: 'speech',
    action: (
      `${twilioHost}/endpoints/twilio/calls/response` +
      `?relay=${relay.id}&trip=${tripId}&query=${twimlOp.queryName}` +
      `&type=${twimlOp.queryType}`
    ),
    partialResultCallback: (
      `${twilioHost}/endpoints/twilio/calls/response` +
      `?relay=${relay.id}&trip=${tripId}&query=${twimlOp.queryName}` +
      `&type=${twimlOp.queryType}&partial=true`
    )
  };
  if (twimlOp.queryHints) {
    args.hints = twimlOp.queryHints;
  }
  const gather = twimlResponse.gather(args);
  // and add subclause to the gather clause.
  await interpretTwimlEvent(tripId, relay, gather, twimlOp.subclause);
}

const twimlFuncs = {
  dial: interpretTwimlDial,
  say: interpretTwimlSay,
  play: interpretTwimlPlay,
  gather: interpretTwimlGather
};

async function interpretTwimlEvent(tripId, relay, twimlResponse, twimlOp) {
  const twimlFunc = twimlFuncs[twimlOp.clause];
  if (!twimlFunc) {
    throw new Error('Could not identify twiml op.');
  }
  await twimlFunc(tripId, relay, twimlResponse, twimlOp);
}

async function interpretTwimlOps(tripId, relay, twimlOps) {
  const twimlResponse = new twilio.twiml.VoiceResponse();
  for (let twimlOp of twimlOps) {
    await interpretTwimlEvent(tripId, relay, twimlResponse, twimlOp);
  }
  return twimlResponse;
}

async function triggerEventAndGatherTwiml(tripId, relay, event) {
  const result = await TripActionController.applyEvent(tripId, event);
  await TripNotifyController.notifyEvent(tripId, event);
  const twimlOps = _.filter(result.resultOps, { operation: 'twiml' });
  const twimlResult = await interpretTwimlOps(tripId, relay, twimlOps);
  return twimlResult;
}

async function interruptCall(callSid, twiml) {
  if (!config.getTwilioClient()) {
    return;
  }
  const twilioHost = config.env.TWILIO_HOST;
  const twimlBase64 = encodeURIComponent(
    new Buffer(twiml.toString()).toString('base64'));
  const url = (
    `${twilioHost}/endpoints/twilio/calls/interrupt` + 
    `?twiml=${twimlBase64}`
  );
  return await config
    .getTwilioClient()
    .calls(callSid)
    .update({ url: url });
}

function hangupOrVoicemail(script, voicemailPath) {
  // If no voicemail configured, hang up.
  if (!voicemailPath) {
    return hangup();
  }
  // Otherwise, play voicemail
  const twimlResponse = new twilio.twiml.VoiceResponse();
  const voicemailUrl = twilioPathForRelayAndMedia(script, voicemailPath);
  twimlResponse.play({}, voicemailUrl);
  twimlResponse.hangup();
  return twimlResponse;
}

async function handleIncomingCall(fromNumber, toNumber) {

  const relay = await RelaysController.findByNumber(toNumber, fromNumber);
  if (!relay) {
    // Relay not found
    logger.warn('Relay not found.');
    return hangup();
  }

  const script = await RelayController.scriptForRelay(relay);
  const relaySpec = RelayController.specForRelay(script, relay);
  if (!relaySpec) {
    logger.warn(`Relay ${relay.id} does not have a spec.`);
    return hangup();
  }

  if (!relaySpec.phone_in) {
    logger.warn(`Relay ${relay.id} does not allow phone in.`);
    return hangupOrVoicemail(script, relaySpec.phone_autoreply);
  }

  // Lookup the trip id or create one.
  const tripId = await TwilioUtil.lookupOrCreateTripId(relay, fromNumber);
  if (!tripId) {
    // If we couldn't create one, probably cos its not a trailhead.
    return hangup();
  }

  const event = {
    type: 'call_received',
    from: relay.asRoleName,
    to: relay.withRoleName
  };
  const twimlResponse = await (
    TwilioCallHandler.triggerEventAndGatherTwiml(tripId, relay, event)
  );
  // If we have a response, then return it
  if (twimlResponse.response.children.length > 0) {
    return twimlResponse;
  }
  // Otherwise, return the auto voicemail.
  logger.error('No twiml events generated by incoming call.');
  return hangupOrVoicemail(script, relaySpec.phone_autoreply);
}

async function handleOutgoingCall(relayId, tripId, answeredByHuman) {
  const relay = await models.Relay.findById(relayId);
  if (!relay) {
    return hangup();
  }
  const event = {
    type: 'call_answered',
    from: relay.withRoleName,
    to: relay.asRoleName,
    answered_by_machine: !answeredByHuman
  };
  const twimlResponse = await (
    TwilioCallHandler.triggerEventAndGatherTwiml(tripId, relay, event)
  );
  if (twimlResponse.response.children.length === 0) {
    logger.error('No twiml events generated by outgoing call.');
    return hangup();
  }
  return twimlResponse;
}

async function handleCallResponse(relayId, tripId, callSid, queryName,
  queryType, speechResult, isPartial) {
  const speechStandardized = standardizeSpeechResult(queryType, speechResult);
  const event = {
    type: 'query_responded',
    query: queryName,
    partial: isPartial,
    response: speechStandardized
  };
  const relay = await models.Relay.findById(relayId);
  const twimlResponse = await (
    TwilioCallHandler.triggerEventAndGatherTwiml(tripId, relay, event)
  );
  if (isPartial) {
    // If we're partial, only respond if we get a signal from the script
    if (twimlResponse.response.children.length > 0) {
      // If this is a partial response, and we have any twiml to respond
      // to, then we can't just return it -- we need to interrupt the
      // call in progress. TODO!
      await TwilioCallHandler.interruptCall(callSid, twimlResponse);
    }
    // Either way, don't return twiml synchronously.
    return new twilio.twiml.VoiceResponse();
  }
  // If we're a final response, we need a response
  if (twimlResponse.response.children.length === 0) {
    logger.error(`No twiml generated by final response to ${queryName}.`);
    return hangup();
  }
  return twimlResponse;
}

async function handleCallEnded(relayId, tripId) {
  const relay = await models.Relay.findById(relayId);
  const event = {
    type: 'call_ended',
    roles: [relay.withRoleName, relay.asRoleName]
  };
  const twimlResponse = (
    await TwilioCallHandler.triggerEventAndGatherTwiml(tripId, relay, event)
  );
  return twimlResponse;
}

/**
 * Do some special case handling on the speech result.
 */
function standardizeSpeechResult(queryType, speechResult) {
  if (queryType === 'phone') {
    return speechResult
      .toLowerCase()
      .replace(/one/g, '1')
      .replace(/two/g, '2')
      .replace(/three/g, '3')
      .replace(/four/g, '4')
      .replace(/five/g, '5')
      .replace(/six/g, '6')
      .replace(/seven/g, '7')
      .replace(/eight/g, '8')
      .replace(/nine/g, '9')
      .replace(/zero/g, '0')
      .replace(/oh/g, '0')
      .replace(/[^\d]/g, '');
  }
  return speechResult;
}

const TwilioCallHandler = {
  handleCallResponse,
  handleCallEnded,
  handleIncomingCall,
  handleOutgoingCall,
  interruptCall,
  triggerEventAndGatherTwiml
};

module.exports = TwilioCallHandler;
