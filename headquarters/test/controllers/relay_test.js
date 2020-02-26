const assert = require('assert');
const sinon = require('sinon');

const { sandbox } = require('../mocks');
const config = require('../../src/config');
const models = require('../../src/models');
const RelayController = require('../../src/controllers/relay');

describe('RelayController', () => {
  describe('#scriptForRelay', () => {
    it('looks up active script for a script name', async () => {
      const stubScript = { name: 'abc', experience: {} };
      const relay = { experienceId: 10, orgId: 20 };

      sandbox.stub(models.Script, 'findOne').resolves(stubScript);
      const res = await RelayController.scriptForRelay(relay);
      assert.strictEqual(res, stubScript);
      sinon.assert.calledWith(models.Script.findOne, {
        where: { isActive: true, isArchived: false },
        include: [{
          model: models.Org,
          as: 'org',
          where: { id: 20 }
        }, {
          model: models.Experience,
          as: 'experience',
          where: { id: 10 }
        }]
      });
    });
  });

  describe('#specForRelay', () => {
    const stubRelays = [
      { for: 'for', with: 'with', as: 'as' },
      { for: 'for2', with: 'with', as: 'as' }
    ];
    const stubScript = { content: { relays: stubRelays } };

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

  describe('#findSiblings', () => {
    it('looks up sibling relays', async () => {
      const relay = { experienceId: 10, departureName: 'dep' };
      const stubResult = { id: 2 };
      sandbox.stub(models.Relay, 'findAll').resolves(stubResult);
      
      const res = await RelayController.findSiblings(relay, 'as', 'with');

      assert.strictEqual(res, stubResult);
      sinon.assert.calledWith(models.Relay.findAll, {
        where: {
          stage: 'test',
          experienceId: relay.experienceId,
          departureName: relay.departureName,
          withRoleName: 'with',
          asRoleName: 'as',
          isActive: true
        }
      });
    });
  });

  describe('#lookupPlayer', () => {
    it('looks up player by relay and phone number', async () => {
      const stubPlayer = { id: 1 };
      const phoneNumber = '1234567890';
      const relay = {
        forRoleName: 'ForRole',
        departureName: 'T1',
        experienceId: 10
      };

      sandbox.stub(models.Player, 'findOne').resolves(stubPlayer);

      const res = await RelayController.lookupPlayer(relay, phoneNumber);

      assert.strictEqual(res, stubPlayer);

      // Check lookup done correctly.
      sinon.assert.calledWith(models.Player.findOne, {
        where: { roleName: relay.forRoleName },
        include: [{
          model: models.User,
          as: 'user',
          where: { phoneNumber: phoneNumber }
        }, {
          model: models.Trip,
          as: 'trip',
          where: {
            experienceId: relay.experienceId,
            departureName: relay.departureName,
            isArchived: false
          },
        }]
      });
    });
  });

  describe('#initiateCall', () => {

    const stubRelay = { id: 3, relayPhoneNumber: '9999999999' };

    const stubPlayer = {
      tripId: 1,
      getUser: async () => ({ phoneNumber: '1111111111' })
    };

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

    const whitelistedNumber = '9144844223';
    const stubTrip = { id: 1 };
    const stubPlayer = { user: { phoneNumber: whitelistedNumber } };
    const stubRelay = {
      isActive: true,
      relayPhoneNumber: '1111111111',
      forRoleName: 'For'
    };

    it('sends a text message', async () => {
      sandbox.stub(models.Player, 'findOne').resolves(stubPlayer);

      await RelayController.sendMessage(stubRelay, stubTrip, 'msg', null);

      // Test twilio message sent
      sinon.assert.calledOnce(config.getTwilioClient().messages.create);
      sinon.assert.calledWith(config.getTwilioClient().messages.create, {
        to: `+1${stubPlayer.user.phoneNumber}`,
        from: `+1${stubRelay.relayPhoneNumber}`,
        body: 'msg'
      });

      // Test player was fetched with right args
      sinon.assert.calledWith(models.Player.findOne, {
        where: { tripId: stubTrip.id, roleName: stubRelay.forRoleName },
        include: [{ model: models.User, as: 'user' }]
      });
    });

    it('sends an image message', async () => {
      sandbox.stub(models.Player, 'findOne').resolves(stubPlayer);

      await RelayController.sendMessage(stubRelay, stubTrip, null, 'url');

      // Test twilio message sent
      sinon.assert.calledOnce(config.getTwilioClient().messages.create);
      sinon.assert.calledWith(config.getTwilioClient().messages.create, {
        to: `+1${stubPlayer.user.phoneNumber}`,
        from: `+1${stubRelay.relayPhoneNumber}`,
        mediaUrl: 'url'
      });
    });

    it('prevents send for non-whitelisted number', async () => {
      const player = { user: { phoneNumber: '4445556666' } };
      sandbox.stub(models.Player, 'findOne').resolves(player);

      await RelayController.sendMessage(stubRelay, stubTrip, 'msg', null);

      // Test twilio message sent
      sinon.assert.notCalled(config.getTwilioClient().messages.create);

      // Test player was fetched with right args
      sinon.assert.calledWith(models.Player.findOne, {
        where: { tripId: stubTrip.id, roleName: stubRelay.forRoleName },
        include: [{ model: models.User, as: 'user' }]
      });
    });

    it('prevents send for inactive relay', async () => {
      const inactiveRelay = { isActive: false };
      sandbox.stub(models.Player, 'findOne').resolves(stubPlayer);

      await RelayController.sendMessage(inactiveRelay, stubTrip, 'msg', null);

      // Test twilio message sent
      sinon.assert.notCalled(config.getTwilioClient().messages.create);

      // Test player was fetched with right args
      sinon.assert.notCalled(models.Player.findOne);
    });
  });
});
