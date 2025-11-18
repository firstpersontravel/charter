const assert = require('assert');
const sinon = require('sinon');

const { sandbox, mockNow } = require('../mocks');
const config = require('../../src/config.ts');
const models = require('../../src/models');
const ExperienceController = require('../../src/controllers/experience');
const RelayController = require('../../src/controllers/relay');

describe('RelayController', () => {
  describe('#scriptForRelay', () => {
    it('looks up active script for a script name', async () => {
      const stubScript = { name: 'abc', experience: {} };
      const relay = { experienceId: 10, orgId: 20 };

      sandbox.stub(ExperienceController, 'findActiveScript').resolves(stubScript);
      const res = await RelayController.scriptForRelay(relay);
      assert.strictEqual(res, stubScript);
      sinon.assert.calledWith(ExperienceController.findActiveScript, 10);
    });
  });

  describe('#specForRelay', () => {
    const stubRelaySpecs = [
      { for: 'for', with: 'with', as: 'as' },
      { for: 'for2', with: 'with', as: 'as' }
    ];
    const stubScript = { content: { relays: stubRelaySpecs } };

    it('finds spec with as, for and with', () => {
      const res = RelayController.specForRelay(stubScript,
        { forRoleName: 'for', withRoleName: 'with', asRoleName: 'as' });
      assert.deepStrictEqual(res, stubScript.content.relays[0]);
    });

    it('returns null if spec not found', () => {
      const res = RelayController.specForRelay(stubScript,
        { forRoleName: 'with2', withRoleName: 'for2', asRoleName: 'for2' });
      assert.strictEqual(res, null);
    });
  });

  describe('#lookupPlayer', () => {
    it('looks up player by relay and phone number', async () => {
      const stubPlayer = { id: 1 };
      const phoneNumber = '+11234567890';
      const relay = {
        forRoleName: 'ForRole',
        experienceId: 10
      };

      sandbox.stub(models.Player, 'findOne').resolves(stubPlayer);

      const res = await RelayController.lookupPlayer(relay.experienceId, relay.forRoleName, phoneNumber);

      assert.strictEqual(res, stubPlayer);

      // Check lookup done correctly.
      sinon.assert.calledWith(models.Player.findOne, {
        where: { roleName: relay.forRoleName },
        include: [{
          model: models.Participant,
          as: 'participant',
          where: { phoneNumber: phoneNumber }
        }, {
          model: models.Trip,
          as: 'trip',
          where: {
            experienceId: relay.experienceId,
            isArchived: false
          },
        }]
      });
    });
  });

  describe('#initiateCall', () => {
    const stubRelay = { id: 3, relayPhoneNumber: '+19999999999', update: () => {} };
    const stubPlayer = {
      tripId: 1,
      getParticipant: async () => ({ phoneNumber: '+11111111111' })
    };

    beforeEach(() => {
      sandbox.stub(stubRelay, 'update');
    });

    it('makes a call', async () => {
      // Test a call from Actor to Player
      await RelayController.initiateCall(stubRelay, stubPlayer);

      sinon.assert.calledOnce(config.getTwilioClient().calls.create);
      assert.deepStrictEqual(
        config.getTwilioClient().calls.create.firstCall.args,
        [{
          from: '+19999999999',
          to: '+11111111111',
          machineDetection: 'enable',
          method: 'POST',
          url: (
            'http://twilio.test/endpoints/twilio/calls/outgoing' +
            '?trip=1&relay=3'
          ),
          statusCallback: (
            'http://twilio.test/endpoints/twilio/calls/status' +
            '?trip=1&relay=3'
          ),
          statusCallbackMethod: 'POST'
        }]);
      
      sinon.assert.calledOnce(stubRelay.update);
    });

    it('sets machineDetection when expecting a message', async () => {
      // Test a call from Actor to Player
      await RelayController.initiateCall(stubRelay, stubPlayer, true);
      const createCallStub = config.getTwilioClient().calls.create;
      assert.strictEqual(
        createCallStub.firstCall.args[0].machineDetection,
        'detectMessageEnd');
    });
  });

  describe('#sendMessage', () => {
    const whitelistedNumber = '+19144844223';
    const stubPlayer = { participant: { phoneNumber: whitelistedNumber } };
    const stubRelay = {
      orgId: 1,
      tripId: 1,
      relayPhoneNumber: '+11111111111',
      messagingServiceId: 'MG1234567890',
      forRoleName: 'For',
      update: () => {}
    };

    beforeEach(() => {
      sandbox.stub(stubRelay, 'update');
    });

    it('sends a text message', async () => {
      sandbox.stub(models.Player, 'findOne').resolves(stubPlayer);

      await RelayController.sendMessage(stubRelay, 'msg', null);

      // Test twilio message sent
      sinon.assert.calledOnce(config.getTwilioClient().messages.create);
      sinon.assert.calledWith(config.getTwilioClient().messages.create, {
        to: stubPlayer.participant.phoneNumber,
        messagingServiceSid: stubRelay.messagingServiceId,
        body: 'msg'
      });

      // Test player was fetched with right args
      sinon.assert.calledWith(models.Player.findOne, {
        where: { tripId: stubRelay.tripId, roleName: stubRelay.forRoleName },
        include: [{ model: models.Participant, as: 'participant' }]
      });

      sinon.assert.calledOnce(stubRelay.update);
    });

    it('sends an image message', async () => {
      sandbox.stub(models.Player, 'findOne').resolves(stubPlayer);

      await RelayController.sendMessage(stubRelay, null, 'url');

      // Test twilio message sent
      sinon.assert.calledOnce(config.getTwilioClient().messages.create);
      sinon.assert.calledWith(config.getTwilioClient().messages.create, {
        to: stubPlayer.participant.phoneNumber,
        messagingServiceSid: stubRelay.messagingServiceId,
        mediaUrl: 'url'
      });
    });

    it('prevents send for non-whitelisted number', async () => {
      const player = { participant: { phoneNumber: '4445556666' } };
      sandbox.stub(models.Player, 'findOne').resolves(player);

      await RelayController.sendMessage(stubRelay, 'msg', null);

      // Test twilio message sent
      sinon.assert.notCalled(config.getTwilioClient().messages.create);

      // Test player was fetched with right args
      sinon.assert.calledWith(models.Player.findOne, {
        where: { tripId: stubRelay.tripId, roleName: stubRelay.forRoleName },
        include: [{ model: models.Participant, as: 'participant' }]
      });
    });

    it('logs a warning on twilio permission error', async () => {
      sandbox.stub(models.Player, 'findOne').resolves(stubPlayer);
      sandbox.stub(models.LogEntry, 'create').resolves();

      config.getTwilioClient().messages.create = sandbox.stub().rejects({
        message: 'geo permissions not enabled',
        code: 21408
      });

      await RelayController.sendMessage(stubRelay, 'msg', null);

      // Test twilio message attempted to be created
      sinon.assert.calledOnce(config.getTwilioClient().messages.create);
      sinon.assert.calledWith(config.getTwilioClient().messages.create, {
        to: stubPlayer.participant.phoneNumber,
        messagingServiceSid: stubRelay.messagingServiceId,
        body: 'msg'
      });

      // Test log entry was created
      sinon.assert.calledWith(models.LogEntry.create, {
        createdAt: mockNow,
        level: 20,
        message: 'Could not send SMS to +19144844223; that region is not enabled.',
        orgId: 1,
        tripId: 1
      });
    });

    it('logs an error on unexpected twilio error', async () => {
      sandbox.stub(models.Player, 'findOne').resolves(stubPlayer);
      sandbox.stub(models.LogEntry, 'create').resolves();

      config.getTwilioClient().messages.create = sandbox.stub().rejects({
        message: 'unknown error',
        code: 123456
      });

      await RelayController.sendMessage(stubRelay, 'msg', null);

      // Test twilio message attempted to be created
      sinon.assert.calledOnce(config.getTwilioClient().messages.create);
      sinon.assert.calledWith(config.getTwilioClient().messages.create, {
        to: stubPlayer.participant.phoneNumber,
        messagingServiceSid: stubRelay.messagingServiceId,
        body: 'msg'
      });

      // Test log entry was created
      sinon.assert.calledWith(models.LogEntry.create, {
        createdAt: mockNow,
        level: 30,
        message: 'Could not send SMS to +19144844223: unknown error',
        orgId: 1,
        tripId: 1
      });
    });
  });
});
