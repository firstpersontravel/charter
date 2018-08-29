const assert = require('assert');
const sinon = require('sinon');

const config = require('../../src/config');
const models = require('../../src/models');
const RelayController = require('../../src/controllers/relay');

const sandbox = sinon.sandbox.create();

describe('RelayController', () => {

  afterEach(() => {
    sandbox.restore();
  });

  describe('#specForRelay', () => {
    const stubScript = {
      content: {
        relays: [
          { for: 'for', with: 'with', as: 'as' },
          { for: 'for2', with: 'with2' }
        ]
      }
    };

    it('finds spec with as, for and with', () => {
      const stubRelay = {
        forRoleName: 'for',
        withRoleName: 'with',
        asRoleName: 'as'
      };

      const res = RelayController.specForRelay(stubScript, stubRelay);

      assert.deepStrictEqual(res, stubScript.content.relays[0]);
    });

    it('finds spec with for and with', () => {
      const stubRelay = {
        forRoleName: 'for2',
        withRoleName: 'with2',
        asRoleName: 'for2'
      };

      const res = RelayController.specForRelay(stubScript, stubRelay);

      assert.deepStrictEqual(res, stubScript.content.relays[1]);
    });

    it('returns null if spec not found', () => {
      const stubRelay = {
        forRoleName: 'with2',
        withRoleName: 'for2',
        asRoleName: 'for2'
      };

      const res = RelayController.specForRelay(stubScript, stubRelay);

      assert.strictEqual(res, null);
    });

  });

  describe('#findOpposites', () => {
    it('locates opposite', async () => {
      const responseSentinel = {};
      const findAllStub = sandbox
        .stub(models.Relay, 'findAll')
        .resolves([responseSentinel]);
      const stubRelay = {
        scriptName: 'script',
        departureName: '1',
        withRoleName: 'A',
        asRoleName: 'B'
      };
      const res = await RelayController.findOpposites(stubRelay);
      assert.strictEqual(res[0], responseSentinel);
      sinon.assert.called(findAllStub);
      assert.deepStrictEqual(findAllStub.firstCall.args, [{
        where: {
          asRoleName: 'A',
          isActive: true,
          departureName: '1',
          scriptName: 'script',
          stage: 'test',
          withRoleName: 'B'
        }
      }]);
    });
  });

  describe('#initiateCall', () => {

    const stubRelay = { id: 3, phoneNumber: '9999999999' };

    const stubParticipant = {
      playthroughId: 1,
      getUser: async () => ({ phoneNumber: '1111111111' })
    };

    it('makes a call', async () => {
      // Test a call from Actor to Player
      await RelayController.initiateCall(stubRelay, stubParticipant);

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
      await RelayController.initiateCall(stubRelay, stubParticipant, true);
      const createCallStub = config.getTwilioClient().calls.create;
      assert.strictEqual(
        createCallStub.firstCall.args[0].machineDetection,
        'detectMessageEnd');
    });
  });

  describe('#sendMessage', () => {
    it.skip('sends a message', () => {});
  });
});
