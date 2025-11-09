const fs = require('fs');
const path = require('path');
const assert = require('assert');
const yaml = require('js-yaml');

const models = require('../../src/models');
const TwilioCallHandler = require('../../src/handlers/twilio_call');
const TestUtil = require('../util');

const examplePath = path.join(__dirname, '../../examples/phonetree.yaml');
const example = yaml.safeLoad(fs.readFileSync(examplePath, 'utf8'));

function assertTwimlContains(res, expected) {
  const str = res.toString();
  if (str.indexOf(expected) === -1) {
    assert.fail(`Expected "${str}" to contain "${expected}".`);
  }
}

async function assertTripAndRelay(script) {
  // Test trip was created
  const trip = await models.Trip.findOne({ where: { scriptId: script.id } });
  assert(trip);

  // Test relay was created
  const relay = await models.Relay.findOne({ where: {
    tripId: trip.id,
    forRoleName: 'Player',
    withRoleName: 'PhoneTree'
  }});

  return { trip: trip, relay: relay };
}

const introMessage = 'Thanks for calling! Lets try a keypad response first. Press 1 or 2.';
const doorMessage = 'Now lets try a voice response. Choose the left or right door.';

function say(message) {
  return `<Say voice="alice">${message}</Say>`;
}

describe('PhoneTreeExample', () => {
  let script;
  let relayEntryway;
  let relayService;

  beforeEach(async () => {
    script = await TestUtil.createExample(example);
    relayEntryway = await TestUtil.createDummyEntrywayForScript(script);
    relayService = await relayEntryway.getRelayService();
  });

  it('runs through left door path', async () => {
    // Start with an incoming call to the entryway.
    const twiml1 = await TwilioCallHandler.handleIncomingCall('6667778888',
      relayService.phoneNumber);

    // Test greeting is returned
    assertTwimlContains(twiml1, say(introMessage));

    // Test trip and relay were created
    const { trip, relay } = await assertTripAndRelay(script);

    // Choose drink
    const twiml2 = await TwilioCallHandler.handleCallResponse(
      relay.id, trip.id, 123, 'CLIP-GREETING', '1', false);

    // Test question is returned
    assertTwimlContains(twiml2, say(doorMessage));

    // Handle response
    const twiml3 = await TwilioCallHandler.handleCallResponse(
      relay.id, trip.id, 123, 'CLIP-DOOR', 'left', false);

    assertTwimlContains(twiml3, say("You found... a brand new car!"));
  });

  it('runs through right door path', async () => {
    // Start with an incoming call to the entryway.
    const twiml1 = await TwilioCallHandler.handleIncomingCall('6667778888',
      relayService.phoneNumber);

    // Test greeting is returned
    assertTwimlContains(twiml1, say(introMessage));

    // Test trip and relay were created
    const { trip, relay } = await assertTripAndRelay(script);

    // Choose drink
    const twiml2 = await TwilioCallHandler.handleCallResponse(
      relay.id, trip.id, 123, 'CLIP-GREETING', '1', false);

    // Test question is returned
    assertTwimlContains(twiml2, say(doorMessage))

    // Handle response
    const twiml3 = await TwilioCallHandler.handleCallResponse(
      relay.id, trip.id, 123, 'CLIP-DOOR', 'right', false);

    assertTwimlContains(twiml3, say("You found... a television!"));
  });

  it('runs through thanks path', async () => {
    // Start with an incoming call to the entryway.
    const twiml1 = await TwilioCallHandler.handleIncomingCall('6667778888',
      relayService.phoneNumber);

    // Test greeting is returned
    assertTwimlContains(twiml1, say(introMessage));

    // Test trip and relay were created
    const { trip, relay } = await assertTripAndRelay(script);

    // Choose drink
    const twiml2 = await TwilioCallHandler.handleCallResponse(
      relay.id, trip.id, 123, 'CLIP-GREETING', '2', false);

    // Test joke is returned
    assertTwimlContains(twiml2, say("Thanks for calling!"));
  });
});
