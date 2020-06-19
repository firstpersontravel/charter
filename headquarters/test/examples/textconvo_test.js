const fs = require('fs');
const path = require('path');
const sinon = require('sinon');
const assert = require('assert');
const yaml = require('js-yaml');

const config = require('../../src/config');
const models = require('../../src/models');
const ExperienceController = require('../../src/controllers/experience');
const TwilioMessageHandler = require('../../src/handlers/twilio_message');
const TestUtil = require('../util');

const examplePath = path.join(__dirname, '../../examples/textconvo.yaml');
const example = yaml.safeLoad(fs.readFileSync(examplePath, 'utf8'));

describe('TextConvoExample', () => {
  let script;
  let entryway;

  beforeEach(async () => {
    config.getTwilioClient().incomingPhoneNumbers.list.resolves([{
      smsUrl: `${config.env.HQ_TWILIO_HOST}/url`,
      phoneNumber: '+13334445555'
    }]);
    script = await TestUtil.createExample(example);
    entryway = (
      await ExperienceController.ensureEntrywayRelays(script.experienceId)
    )[0];
  });

  it('runs through polite conversation', async () => {
    // Test start on text to entryway
    const msgResult = await TwilioMessageHandler.handleIncomingMessage(
      '5556667777', entryway.relayPhoneNumber, 'hi', []);

    // Test message handled ok
    assert.strictEqual(msgResult, true);

    // Test trip was created
    const trip = await models.Trip.findOne({ where: { scriptId: script.id } });
    assert(trip);

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

    // Test first response message was sent via twilio
    const createMessageStub = config.getTwilioClient().messages.create;
    sinon.assert.calledOnce(createMessageStub);
    assert.deepStrictEqual(createMessageStub.firstCall.args, [{
      body: 'Why hello there, fine sir/lady/being! What is your name?',
      from: '+13334445555',
      to: '+15556667777'
    }]);

    // Response
    await TwilioMessageHandler.handleIncomingMessage(
      '5556667777', entryway.relayPhoneNumber, 'Sam', []);

    // Test interpreted
    await trip.reload();
    assert.strictEqual(trip.values.player_name, 'Sam');

    // Test second response sent
    sinon.assert.calledTwice(createMessageStub);
    assert.deepStrictEqual(createMessageStub.getCall(1).args, [{
      body: 'Greetings, Sam. You may now await your righteous quest.',
      from: '+13334445555',
      to: '+15556667777'
    }]);
  });

  it('runs through rude conversation', async () => {
    // Test start on text to entryway
    await TwilioMessageHandler.handleIncomingMessage(
      '5556667777', entryway.relayPhoneNumber, 'yo', []);

    // Test trip was created
    const trip = await models.Trip.findOne({ where: { scriptId: script.id } });
    assert(trip);

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
