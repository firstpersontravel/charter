const fs = require('fs');
const path = require('path');
const sinon = require('sinon');
const assert = require('assert');
const yaml = require('js-yaml');

const config = require('../../src/config.ts');
const models = require('../../src/models');
const TwilioMessageHandler = require('../../src/handlers/twilio_message');
const TestUtil = require('../util');

const examplePath = path.join(__dirname, '../../examples/textconvo.yaml');
const example = yaml.safeLoad(fs.readFileSync(examplePath, 'utf8'));

async function assertTripAndRelay(script) {
  // Test trip was created
  const trip = await models.Trip.findOne({ where: { scriptId: script.id } });
  assert(trip);

  // Test relay was created
  const relay = await models.Relay.findOne({ where: {
    tripId: trip.id,
    forRoleName: 'Knight',
    withRoleName: 'King'
  }});

  return { trip: trip, relay: relay };
}

describe('TextConvoExample', () => {
  const playerNumber = '+15556667777';
  let script;
  let relayEntryway;
  let relayService;

  beforeEach(async () => {
    script = await TestUtil.createExample(example);
    relayEntryway = await TestUtil.createDummyEntrywayForScript(script);
    relayService = await relayEntryway.getRelayService();
  });

  it('runs through polite conversation', async () => {
    // Test start on text to entryway
    const msgResult = await TwilioMessageHandler.handleIncomingMessage(
      playerNumber, relayService.phoneNumber, 'hi', []);

    // Test message handled ok
    assert.strictEqual(msgResult, true);

    // Test trip was created
    const { trip } = await assertTripAndRelay(script);

    // Test value was set
    assert.strictEqual(trip.values.game_started, true);

    // Test message was created
    const messages = await models.Message.findAll({
      order: [['id', 'ASC']],
      where: { tripId: trip.id }
    });
    assert.strictEqual(messages.length, 2);
    assert.strictEqual(messages[1].content,
      'Why hello there, fine sir/lady/being! What is your name?');

    // Test welcome message and first response message were sent via twilio
    const createMessageStub = config.getTwilioClient().messages.create;
    sinon.assert.calledTwice(createMessageStub);

    assert.deepStrictEqual(createMessageStub.firstCall.args, [{
      body: 'Welcome to the test experience!',
      messagingServiceSid: 'MG1234',
      to: playerNumber
    }]);

    assert.deepStrictEqual(createMessageStub.secondCall.args, [{
      body: 'Why hello there, fine sir/lady/being! What is your name?',
      messagingServiceSid: 'MG1234',
      to: playerNumber
    }]);

    // Response
    await TwilioMessageHandler.handleIncomingMessage(
      playerNumber, relayService.phoneNumber, 'Sam', []);

    // Test interpreted
    await trip.reload();
    assert.strictEqual(trip.values.player_name, 'Sam');

    // Test second response sent
    sinon.assert.calledThrice(createMessageStub);
    assert.deepStrictEqual(createMessageStub.getCall(2).args, [{
      body: 'Greetings, Sam. You may now await your righteous quest.',
      messagingServiceSid: 'MG1234',
      to: playerNumber
    }]);
  });

  it('runs through rude conversation', async () => {
    // Test start on text to entryway
    await TwilioMessageHandler.handleIncomingMessage(
      playerNumber, relayService.phoneNumber, 'yo', []);

    // Test trip was created
    const { trip } = await assertTripAndRelay(script);

    // Test message was created
    const messages = await models.Message.findAll({
      order: [['id', 'ASC']],
      where: { tripId: trip.id }
    });
    assert.strictEqual(messages.length, 2);
    assert.strictEqual(messages[1].content,
      'How rude, not even a greeting! What is your name?');
  });
});
