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
    { name: 'Knight', title: 'Knight' },
    { name: 'King', title: 'King' }
  ],
  relays: [
    { name: 'main', for: 'Knight', with: 'King', entryway: true }
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
    forRoleName: 'Knight',
    withRoleName: 'King'
  }});

  return { trip: trip, relay: relay };
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
      // Create a participant with the desired phone number
      const participant = await models.Participant.create({
        orgId: trip.orgId,
        experienceId: trip.experienceId,
        createdAt: mockNow,
        phoneNumber: playerNumber
      });
      // Associated it with the trip
      const player = await models.Player.findOne({
        where: {
          tripId: trip.id,
          roleName: 'Knight'
        }
      });
      await player.update({
        participantId: participant.id
      });
    });

    it('sends message outgoing without entryway', async () => {
      await KernelController.applyAction(trip.id, {
        name: 'send_text',
        params: {
          from_role_name: 'King',
          to_role_name: 'Knight',
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
});
