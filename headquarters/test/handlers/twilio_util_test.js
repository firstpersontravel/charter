const assert = require('assert');
const sinon = require('sinon');

const TextUtil = require('fptcore/src/utils/text');

const { sandbox } = require('../mocks');
const models = require('../../src/models');
const RelayController = require('../../src/controllers/relay');
const RelaysController = require('../../src/controllers/relays');
const EntrywayController = require('../../src/controllers/entryway');
const ExperienceController = require('../../src/controllers/experience');
const TripResetHandler = require('../../src/handlers/trip_reset');
const TwilioUtil = require('../../src/handlers/twilio_util');

describe('TwilioUtil', () => {
  describe('#getRelayForExistingOrNewTrip', () => {

    const playerNum = '+11112223333';
    const relayNum = '+12223334444';
    const stubTrip = { id: 2 };
    const stubCreatedRelay = {};

    beforeEach(() => {
      sandbox.stub(EntrywayController, 'createTripFromEntryway').resolves(stubTrip);
      sandbox.stub(TripResetHandler, 'resetToStart').resolves(null);      
      sandbox.stub(RelaysController, 'createRelayFromIncoming').resolves(stubCreatedRelay);
      sandbox.stub(RelayController, 'sendMessage').resolves(null);
      sandbox.stub(TwilioUtil, 'sendCharterDefaultEntrywayMessage').resolves(null);
    });

    it('returns existing relay', async () => {
      const stubRelay = { id: 1 };
      sandbox.stub(RelaysController, 'findByNumber').resolves(stubRelay);

      const result = await TwilioUtil.getRelayForExistingOrNewTrip(relayNum, playerNum, 'hi');
      assert.strictEqual(result, stubRelay);

      sinon.assert.calledWith(RelaysController.findByNumber, relayNum, playerNum);

      // No need for welcome message
      sinon.assert.notCalled(RelayController.sendMessage);
    });

    it('no action if no relay service found', async () => {
      sandbox.stub(RelaysController, 'findByNumber').resolves(null);
      sandbox.stub(models.RelayService, 'findOne').resolves(null);
      sandbox.stub(models.RelayEntryway, 'findOne').resolves(null);

      const result = await TwilioUtil.getRelayForExistingOrNewTrip(relayNum, playerNum, 'hi');
      assert.strictEqual(result, null);

      // Can't send any messages if no relay service
      sinon.assert.notCalled(RelayController.sendMessage);
      sinon.assert.notCalled(TwilioUtil.sendCharterDefaultEntrywayMessage);
    });

    it('returns charter default welcome if no relay entryway', async () => {
      const stubRelayService = {};
      sandbox.stub(RelaysController, 'findByNumber').resolves(null);
      sandbox.stub(models.RelayService, 'findOne').resolves(stubRelayService);
      sandbox.stub(models.RelayEntryway, 'findOne').resolves(null);

      const result = await TwilioUtil.getRelayForExistingOrNewTrip(relayNum, playerNum, 'hi');
      assert.strictEqual(result, null);

      sinon.assert.notCalled(EntrywayController.createTripFromEntryway);
      sinon.assert.notCalled(TripResetHandler.resetToStart);
      sinon.assert.notCalled(RelaysController.createRelayFromIncoming);

      // Send charter default message since can't associate entryway
      sinon.assert.notCalled(RelayController.sendMessage);
      sinon.assert.calledWith(TwilioUtil.sendCharterDefaultEntrywayMessage, stubRelayService, playerNum);
    });

    it('returns charter default welcome if no matching entryway relay spec in script', async () => {
      const stubRelayService = {};
      const stubRelayEntryway = { experienceId: 1, keyword: '', welcome: 'hi hi hi'};
      const stubScript = {
        content: {
          relays: [{ for: 'Player', with: 'System' }]
        }
      };

      sandbox.stub(RelaysController, 'findByNumber').resolves(null);
      sandbox.stub(models.RelayService, 'findOne').resolves(stubRelayService);
      sandbox.stub(models.RelayEntryway, 'findOne').resolves(stubRelayEntryway);
      sandbox.stub(ExperienceController, 'findActiveScript').resolves(stubScript);

      const result = await TwilioUtil.getRelayForExistingOrNewTrip(relayNum, playerNum, 'hi');
      assert.strictEqual(result, null);

      sinon.assert.notCalled(EntrywayController.createTripFromEntryway);
      sinon.assert.notCalled(TripResetHandler.resetToStart);
      sinon.assert.notCalled(RelaysController.createRelayFromIncoming);

      // Send charter default message since can't associate entryway
      sinon.assert.notCalled(RelayController.sendMessage);
      sinon.assert.calledWith(TwilioUtil.sendCharterDefaultEntrywayMessage, stubRelayService, playerNum);
    });

    it('creates trip from relay entryway with welcome message', async () => {
      const stubRelayService = {};
      const stubRelayEntryway = { experienceId: 1, keyword: '', welcome: 'hi' };
      const stubScript = {
        content: {
          relays: [{ for: 'Player', with: 'System', entryway: true }]
        }
      };

      sandbox.stub(RelaysController, 'findByNumber').resolves(null);
      sandbox.stub(models.RelayService, 'findOne').resolves(stubRelayService);
      sandbox.stub(models.RelayEntryway, 'findOne').resolves(stubRelayEntryway);
      sandbox.stub(ExperienceController, 'findActiveScript').resolves(stubScript);

      const result = await TwilioUtil.getRelayForExistingOrNewTrip(relayNum, playerNum, 'hi');
      assert.strictEqual(result, stubCreatedRelay);

      const expectedName = TextUtil.formatPhone('(111) 222-3333');
      sinon.assert.calledWith(EntrywayController.createTripFromEntryway, stubScript, 'Player', playerNum, expectedName);
      sinon.assert.calledWith(TripResetHandler.resetToStart, stubTrip.id);
      sinon.assert.calledWith(RelaysController.createRelayFromIncoming, stubRelayService, stubRelayEntryway, stubScript.content.relays[0], stubTrip, playerNum);

      // Send custom welcome message since we have an entryway associated
      sinon.assert.calledWith(RelayController.sendMessage, stubCreatedRelay, stubRelayEntryway.welcome);
      sinon.assert.notCalled(TwilioUtil.sendCharterDefaultEntrywayMessage);
    });
  });
});
