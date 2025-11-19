const assert = require('assert');
const sinon = require('sinon');

const config = require('../../src/config.ts');
const models = require('../../src/models');
const { mockNow } = require('../mocks');
const TwilioMessageHandler = require('../../src/handlers/twilio_message');
const KernelController = require('../../src/kernel/kernel');
const TestUtil = require('../util');
const RelaysController = require('../../src/controllers/relays');

// Basic example for the purposes of testing twilio functionality
const example = {
  roles: [
    { name: 'Player', title: 'Player' },
    { name: 'System', title: 'System' }
  ],
  relays: [
    { name: 'main', for: 'Player', with: 'System', entryway: true }
  ],
  scenes: [
    {name: 'main', title: 'main'}
  ]
};

async function assertTripAndRelay(script) {
  // Test trip was created
  const trip = await models.Trip.findOne({ where: { scriptId: script.id } });
  assert(trip);

  // Test relay was created
  const relay = await models.Relay.findOne({ where: {
    tripId: trip.id,
    forRoleName: 'Player',
    withRoleName: 'System'
  }});

  return { trip: trip, relay: relay };
}

async function assignPhoneNumberToRole(trip, playerNumber, roleName) {
  const participant = await models.Participant.create({
    orgId: trip.orgId,
    experienceId: trip.experienceId,
    createdAt: mockNow,
    phoneNumber: playerNumber
  });
  const player = await models.Player.findOne({
    where: { tripId: trip.id, roleName: roleName }
  });
  await player.update({ participantId: participant.id });
}

describe('Twilio Integration', () => {
  const playerNumber = '+15556667777';

  describe('outgoing text', () => {
    let script;
    let trip;
    let relayService;
  
    beforeEach(async () => {
      script = await TestUtil.createExample({ content: example });
      trip = await TestUtil.createDummyTripForScript(script);
      relayService = await TestUtil.createDummyRelayService();
      await assignPhoneNumberToRole(trip, playerNumber, 'Player');
    });

    it('sends message outgoing without entryway', async () => {
      await KernelController.applyAction(trip.id, {
        name: 'send_text',
        params: {
          from_role_name: 'System',
          to_role_name: 'Player',
          content: 'outgoing test message',
        }
      });
  
      // Assert welcome and outgoing message was sent
      sinon.assert.calledTwice(config.getTwilioClient().messages.create);
      assert.deepStrictEqual(config.getTwilioClient().messages.create.firstCall.args, [{
        body: RelaysController.getDefaultWelcome(),
        messagingServiceSid: relayService.sid,
        to: playerNumber
      }]);

      assert.deepStrictEqual(config.getTwilioClient().messages.create.secondCall.args, [{
        body: 'outgoing test message',
        messagingServiceSid: relayService.sid,
        to: playerNumber
      }]);
    });
  });

  describe('incoming text', () => {
    let script;
    let relayEntryway;
    let relayService;
    let altScript;
    let altRelayEntryway;
    let altRelayService;
  
    beforeEach(async () => {
      script = await TestUtil.createExample({ content: example });
      relayEntryway = await TestUtil.createDummyEntrywayForScript(script);
      relayService = await relayEntryway.getRelayService();
  
      altScript = await TestUtil.createExample({ content: example });
      altRelayEntryway = await TestUtil.createDummyEntrywayForScript(altScript, '+12223334445');
      altRelayService = await altRelayEntryway.getRelayService();
    });

    it('selects entryway with wildcard', async () => {
      await relayEntryway.update({ keyword: '' });
      await altRelayEntryway.update({ keyword: 'not used' });

      // Test start on text to entryway
      await TwilioMessageHandler.handleIncomingMessage(
        playerNumber, relayService.phoneNumber, 'something something', []);

      // Test trip was created with original script, not alternate one (with blank '' keyword)
      const { trip } = await assertTripAndRelay(script);
      assert.strictEqual(trip.scriptId, script.id);

      // Assert welcome message was sent
      sinon.assert.calledOnce(config.getTwilioClient().messages.create);

      assert.deepStrictEqual(config.getTwilioClient().messages.create.firstCall.args, [{
        body: relayEntryway.welcome,
        messagingServiceSid: 'MG1234',
        to: playerNumber
      }]);
    });

    it('prefers entryway with matching keyword', async () => {
      await relayEntryway.update({ keyword: 'keyword1' });
      await altRelayEntryway.update({ keyword: '' });

      // Test start on text to entryway
      await TwilioMessageHandler.handleIncomingMessage(
        playerNumber, relayService.phoneNumber, 'kEyWord1 something something', []);

      // Test trip was created with original script, not alternate one (with blank '' keyword)
      const { trip } = await assertTripAndRelay(script);
      assert.strictEqual(trip.scriptId, script.id);

      // Assert welcome message was sent
      sinon.assert.calledOnce(config.getTwilioClient().messages.create);

      assert.deepStrictEqual(config.getTwilioClient().messages.create.firstCall.args, [{
        body: relayEntryway.welcome,
        messagingServiceSid: 'MG1234',
        to: playerNumber
      }]);
    });

    it('selects wildcard entryway if no matching keyword', async () => {
      await relayEntryway.update({ keyword: 'keyword1' });
      await altRelayEntryway.update({ keyword: '' });

      // Test start on text to entryway
      await TwilioMessageHandler.handleIncomingMessage(
        playerNumber, relayService.phoneNumber, 'kEyWord1 something something', []);

      // Test trip was created with original script, not alternate one (with blank '' keyword)
      const { trip } = await assertTripAndRelay(script);
      assert.strictEqual(trip.scriptId, script.id);

      // Assert welcome message was sent
      sinon.assert.calledOnce(config.getTwilioClient().messages.create);

      assert.deepStrictEqual(config.getTwilioClient().messages.create.firstCall.args, [{
        body: relayEntryway.welcome,
        messagingServiceSid: 'MG1234',
        to: playerNumber
      }]);
    });

    it('skips entryway without matching keyword', async () => {
      await relayEntryway.update({ keyword: 'keyword1' });
      await altRelayEntryway.update({ keyword: 'keyword2' });

      // Test start on text to entryway
      await TwilioMessageHandler.handleIncomingMessage(
        playerNumber, relayService.phoneNumber, 'kEyWord3 something something', []);

      // Test no trip was created since the keyword didn't match
      const trip = await models.Trip.findOne({ where: { scriptId: script.id } });
      assert.strictEqual(trip, null);

      // Charter default welcome message is sent.
      assert.deepStrictEqual(config.getTwilioClient().messages.create.firstCall.args, [{
        body: RelaysController.getDefaultWelcome(),
        messagingServiceSid: 'MG1234',
        to: playerNumber
      }]);
    });

    it('selects alternate with matching keyword', async () => {
      await relayEntryway.update({ keyword: 'keyword1' });
      await altRelayEntryway.update({ keyword: 'keyword2', 'welcome': 'alternate welcome' });

      // Test start on text to entryway
      await TwilioMessageHandler.handleIncomingMessage(
        playerNumber, altRelayService.phoneNumber, 'kEyWord2 something something', []);

      // Test alternate script was selected
      const { trip } = await assertTripAndRelay(altScript);
      assert.strictEqual(trip.scriptId, altScript.id);

      // Assert welcome message was sent
      sinon.assert.calledOnce(config.getTwilioClient().messages.create);

      assert.deepStrictEqual(config.getTwilioClient().messages.create.firstCall.args, [{
        body: altRelayEntryway.welcome,
        messagingServiceSid: 'MG1234',
        to: playerNumber
      }]);
    });

    it('selects alternate with matching keyword over wildcard', async () => {
      await relayEntryway.update({ keyword: '' });
      await altRelayEntryway.update({ keyword: 'keyword2', 'welcome': 'alternate welcome' });

      // Test start on text to entryway
      await TwilioMessageHandler.handleIncomingMessage(
        playerNumber, altRelayService.phoneNumber, 'kEyWord2 something something', []);

      // Test alternate script was selected
      const { trip } = await assertTripAndRelay(altScript);
      assert.strictEqual(trip.scriptId, altScript.id);
    });

    it('start new trip after archive', async () => {
      await relayEntryway.update({ keyword: '' });
      await altRelayEntryway.update({ keyword: 'not used' });

      // Test start on text to entryway
      await TwilioMessageHandler.handleIncomingMessage(
        playerNumber, relayService.phoneNumber, 'something something', []);

      // Test trip was created with original script, not alternate one (with blank '' keyword)
      const { trip } = await assertTripAndRelay(script);
      assert.strictEqual(trip.scriptId, script.id);

      // Assert welcome message was sent
      sinon.assert.calledOnce(config.getTwilioClient().messages.create);

      // Archive trip
      trip.update({ isArchived: true });

      // Send another text
      await TwilioMessageHandler.handleIncomingMessage(
        playerNumber, relayService.phoneNumber, 'something something', []);

      // Assert another trip was created
      const trips = await models.Trip.findAll({ where: { scriptId: script.id } });
      assert.strictEqual(trips.length, 2);
    });
  });

  describe('outgoing call', () => {
    const callExample = Object.assign({}, example, {
      clips: [{
        scene: 'main',
        name: 'call_clip',
        title: 'Clip',
        transcript: 'This is a test call clip.',
        answer_expected: true,
        answer_hints: ['yes', 'no']
      }],
      cues: [{
        scene: 'main',
        name: 'cue',
        title: 'Cue'
      }],
      triggers: [{
        scene: 'main',
        name: 'initiate_call_on_cue',
        event: { type: 'cue_signaled', cue: 'cue' },
        actions: [{
          id: 1,
          name: 'initiate_call',
          as_role_name: 'System',
          to_role_name: 'Player'
        }, {
          id: 2,
          name: 'play_clip',
          clip_name: 'call_clip'
        }]
      }]
    });

    let script;
    let trip;
    let relayService;

    beforeEach(async () => {
      script = await TestUtil.createExample({ content: callExample });
      trip = await TestUtil.createDummyTripForScript(script);
      relayService = await TestUtil.createDummyRelayService();
      await assignPhoneNumberToRole(trip, playerNumber, 'Player');
    });

    it('dials the player', async () => {
      await KernelController.applyAction(trip.id, {
        name: 'initiate_call',
        params: {
          as_role_name: 'System',
          to_role_name: 'Player',
        }
      });

      // If no twiml ops are provided, a url is passed to the call.
      sinon.assert.calledOnce(config.getTwilioClient().calls.create);
      assert.deepStrictEqual(config.getTwilioClient().calls.create.firstCall.args, [{
        from: relayService.phoneNumber,
        to: playerNumber,
        asyncAmd: 'true',
        machineDetection: 'enable',
        method: 'POST',
        statusCallback: 'http://twilio.test/endpoints/twilio/calls/status?trip=1&relay=1',
        statusCallbackMethod: 'POST',
        url: 'http://twilio.test/endpoints/twilio/calls/outgoing?trip=1&relay=1'
      }]);
    });

    it('dials the player with a message', async () => {
      await KernelController.applyAction(trip.id, {
        name: 'signal_cue',
        params: { cue_name: 'cue' }
      });

      // If twiml ops are provided, pass them in directly
      sinon.assert.calledOnce(config.getTwilioClient().calls.create);
      assert.deepStrictEqual(config.getTwilioClient().calls.create.firstCall.args, [{
        from: relayService.phoneNumber,
        to: playerNumber,
        asyncAmd: 'true',
        machineDetection: 'enable',
        method: 'POST',
        twiml: (
          '<?xml version="1.0" encoding="UTF-8"?>' +
          '<Response><Gather input="dtmf speech" timeout="10" speechTimeout="5" ' +
          'action="http://twilio.test/endpoints/twilio/calls/response?relay=1&amp;trip=1&amp;clip=call_clip" ' + 
          'partialResultCallback="http://twilio.test/endpoints/twilio/calls/response?relay=1&amp;trip=1&amp;clip=call_clip&amp;partial=true" ' + 
          'hints="yes no">' + 
          '<Say voice="alice">This is a test call clip.</Say>' + 
          '</Gather></Response>'
        ),
        statusCallback: 'http://twilio.test/endpoints/twilio/calls/status?trip=1&relay=1',
        statusCallbackMethod: 'POST',
      }]);
    });
  });
});
