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
  const fromNumber = req.body.From.replace('+1', '');
  const toNumber = req.body.To.replace('+1', '');
  const twimlResponse = await (
    TwilioCallHandler.handleIncomingCall(fromNumber, toNumber)
  );
  handleTwimlResponse(res, twimlResponse);
}

async function incomingCallStatusRoute(req, res) {
  const fromNumber = req.body.From.replace('+1', '');
  const toNumber = req.body.To.replace('+1', '');

  const relay = await RelaysController.findByNumber(toNumber, fromNumber);
  if (!relay) {
    logger.warn('Status received without matching relay.');
    res.status(500).send('No relay match.');
    return;
  }

  const player = RelayController.lookupPlayer(relay, fromNumber);
  if (!player) {
    logger.warn('Status received without matching player.');
    res.status(500).send('No player match.');
    return;
  }
  if (req.body.CallStatus !== 'completed') {
    logger.warn(`Unrecognized call status: ${req.body.CallStatus}`);
    res.status(200).send('OK');
    return;
  }
  await TwilioCallHandler.handleCallEnded(relay.id, player.tripId);
  handleTwimlResponse(res);
}

async function outgoingCallRoute(req, res) {
  const tripId = Number(req.query.trip);
  const relayId = Number(req.query.relay);
  const answeredBy = req.body.AnsweredBy;
  const answeredByHuman = _.includes(['human', 'unknown'], answeredBy);
  const twimlResponse = await (
    TwilioCallHandler.handleOutgoingCall(relayId, tripId, answeredByHuman)
  );
  handleTwimlResponse(res, twimlResponse);
}

async function callResponseRoute(req, res) {
  const relayId = Number(req.query.relay);
  const tripId = Number(req.query.trip);
  const queryName = req.query.query;
  const queryType = req.query.type || 'normal';
  const callSid = req.body.CallSid;
  const isPartial = req.query.partial === 'true';
  const speechResultKey = isPartial ? 'UnstableSpeechResult' : 'SpeechResult';
  const speechResult = req.body[speechResultKey];
  const twimlResponse = await (
    TwilioCallHandler.handleCallResponse(
      relayId, tripId, callSid, queryName,
      queryType, speechResult, isPartial)
  );
  handleTwimlResponse(res, twimlResponse);
}

async function callStatusRoute(req, res) {
  const relayId = Number(req.query.relay);
  const tripId = Number(req.query.trip);
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
  const twimlText = new Buffer(twimlBase64, 'base64').toString('utf-8');
  res.status(200);
  res.set('Content-Type', 'application/xml');
  res.send(twimlText);
}

async function incomingMessageRoute(req, res) {
  const fromNumber = req.body.From.replace('+1', '');
  const toNumber = req.body.To.replace('+1', '');
  const body = req.body.Body;
  const media = _.range(Number(req.body.NumMedia))
    .map(i => ({
      url: req.body[`MediaUrl${i}`],
      contentType: req.body[`MediaContentType${i}`]
    }));
  await TwilioMessageHandler
    .handleIncomingMessage(fromNumber, toNumber, body, media);
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
