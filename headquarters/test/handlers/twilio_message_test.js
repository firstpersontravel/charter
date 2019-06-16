const assert = require('assert');
const sinon = require('sinon');

const { sandbox } = require('../mocks');
const RelayController = require('../../src/controllers/relay');
const RelaysController = require('../../src/controllers/relays');
const KernelController = require('../../src/kernel/kernel');
const TwilioMessageHandler = require('../../src/handlers/twilio_message');
const TwilioUtil = require('../../src/handlers/twilio_util');

describe('TwilioMessageHandler', () => {
  describe('#handleIncomingMessage', () => {
    const script = {
      content: {
        relays: [{
          for: 'From',
          as: 'From',
          with: 'To'
        }]
      }
    };
    const relaySentinel = {
      id: 2,
      experienceId: 20,
      forRoleName: 'From',
      asRoleName: 'From',
      withRoleName: 'To'
    };

    beforeEach(() => {
      sandbox.stub(RelayController, 'scriptForRelay').resolves(script);
      sandbox.stub(RelaysController, 'findByNumber').resolves(relaySentinel);
      sandbox.stub(TwilioUtil, 'lookupOrCreateTripId').resolves(100);
      sandbox.stub(KernelController, 'applyAction').resolves();
    });

    it('handles incoming text message', async () => {
      const result = await (
        TwilioMessageHandler.handleIncomingMessage(
          '123', '456', 'incomïng mêssage', []));

      assert.strictEqual(result, true);
      sinon.assert.calledOnce(KernelController.applyAction);
      assert.deepStrictEqual(
        KernelController.applyAction.firstCall.args,
        [100, {
          name: 'send_text',
          params: {
            from_role_name: 'From',
            content: 'incomïng mêssage',
            from_relay_id: 2,
            to_role_name: 'To'
          }
        }]);
    });

    it('handles incoming MMS image', async () => {
      const result = await (
        TwilioMessageHandler.handleIncomingMessage(
          '123', '456', null,
          [{ url: 'http://test/image.jpg', contentType: 'image/jpg' }]));

      assert.strictEqual(result, true);
      sinon.assert.calledOnce(KernelController.applyAction);
      assert.deepStrictEqual(
        KernelController.applyAction.firstCall.args,
        [100, {
          name: 'send_image',
          params: {
            from_role_name: 'From',
            content: 'http://test/image.jpg',
            from_relay_id: 2,
            to_role_name: 'To'
          }
        }]);
    });

    it('handles message with text and mms', async () => {
      const result = await TwilioMessageHandler.handleIncomingMessage(
        '123', '456', 'text',
        [{ url: 'http://test/image.jpg', contentType: 'image/jpg' }]);

      assert.strictEqual(result, true);
      sinon.assert.calledTwice(KernelController.applyAction);
      assert.deepStrictEqual(
        KernelController.applyAction.firstCall.args[1].name,
        'send_text');
      assert.deepStrictEqual(
        KernelController.applyAction.secondCall.args[1].name,
        'send_image');
    });
  });
});
