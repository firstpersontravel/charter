const _ = require('lodash');
const twilio = require('twilio');

const config = require('../config');
const RelayController = require('../controllers/relay');
const RelaysController = require('../controllers/relays');
const TwilioCallHandler = require('../handlers/twilio_call');
const TwilioMessageHandler = require('../handlers/twilio_message');

var logger = config.logger.child({ name: 'routes.endpoints' });

function handleTwimlResponse(res, twimlResponse) {
  res.status(200);
  res.set('Content-Type', 'application/xml');
  res.send(twimlResponse ? twimlResponse.toString() : '');
}

async function incomingCallRoute(req, res) {
  const twimlResponse = await (
    TwilioCallHandler.handleIncomingCall(req.body.From, req.body.To)
  );
  handleTwimlResponse(res, twimlResponse);
}

async function incomingCallStatusRoute(req, res) {
  const relay = await RelaysController.findByNumber(req.body.To, req.body.From);
  if (!relay) {
    logger.warn('Status received without matching relay.');
    res.status(500).end();
    return;
  }

  const player = await RelayController.lookupPlayer(relay.experienceId, relay.forRoleName, req.body.From);
  if (!player) {
    logger.warn('Status received without matching player.');
    res.status(500).end();
    return;
  }
  if (req.body.CallStatus !== 'completed') {
    logger.warn(`Unrecognized call status: ${req.body.CallStatus}`);
    res.status(200).end();
    return;
  }
  await TwilioCallHandler.handleCallEnded(relay.id, player.tripId);
  handleTwimlResponse(res);
}

const numOrFirst = numOrList => Number(numOrList.length > 0 ? numOrList[0] : numOrList);

async function outgoingCallRoute(req, res) {
  const tripId = numOrFirst(req.query.trip);
  const relayId = numOrFirst(req.query.relay);
  const answeredBy = req.body.AnsweredBy;
  const answeredByHuman = _.includes(['human', 'unknown'], answeredBy);
  const twimlResponse = await (
    TwilioCallHandler.handleOutgoingCall(relayId, tripId, answeredByHuman)
  );
  handleTwimlResponse(res, twimlResponse);
}

async function callResponseRoute(req, res) {
  const relayId = numOrFirst(req.query.relay);
  const tripId = numOrFirst(req.query.trip);
  const clipName = req.query.clip;
  const callSid = req.body.CallSid;
  const isPartial = req.query.partial === 'true';
  const speechResultKey = isPartial ? 'UnstableSpeechResult' : 'SpeechResult';
  const speechResult = req.body[speechResultKey];
  const digitsResult = req.body.Digits;
  const response = digitsResult || speechResult;
  const twimlResponse = await (
    TwilioCallHandler.handleCallResponse(relayId, tripId, callSid, clipName, 
      response, isPartial)
  );
  handleTwimlResponse(res, twimlResponse);
}

async function callStatusRoute(req, res) {
  const relayId = numOrFirst(req.query.relay);
  const tripId = numOrFirst(req.query.trip);
  if (req.body.CallStatus !== 'completed') {
    logger.info(`Unrecognized call status: ${req.body.CallStatus}`);
    res.status(200).send('OK');
    return;
  }
  await TwilioCallHandler.handleCallEnded(relayId, tripId);
  handleTwimlResponse(res);
}

async function callInterruptRoute(req, res) {
  const twimlBase64 = req.query.twiml;
  const twimlText = Buffer.from(twimlBase64, 'base64').toString('utf-8');
  res.status(200);
  res.set('Content-Type', 'application/xml');
  res.send(twimlText);
}

async function incomingMessageRoute(req, res) {
  const body = req.body.Body;
  const media = _.range(Number(req.body.NumMedia))
    .map(i => ({
      url: req.body[`MediaUrl${i}`],
      contentType: req.body[`MediaContentType${i}`]
    }));
  await TwilioMessageHandler
    .handleIncomingMessage(req.body.From, req.body.To, body, media);
  const twimlResponse = new twilio.twiml.MessagingResponse();
  handleTwimlResponse(res, twimlResponse);
}

module.exports = {
  callInterruptRoute,
  callResponseRoute,
  callStatusRoute,
  incomingCallRoute,
  incomingCallStatusRoute,
  incomingMessageRoute,
  outgoingCallRoute
};
