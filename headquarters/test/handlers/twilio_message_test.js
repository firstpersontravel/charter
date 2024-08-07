const assert = require('assert');
const sinon = require('sinon');

const { sandbox } = require('../mocks');
const RelayController = require('../../src/controllers/relay');
const KernelController = require('../../src/kernel/kernel');
const TwilioMessageHandler = require('../../src/handlers/twilio_message');
const TwilioUtil = require('../../src/handlers/twilio_util');

describe('TwilioMessageHandler', () => {
  beforeEach(() => {
    sandbox.stub(KernelController, 'applyAction').resolves();
  });

  describe('#handleIncomingMessage', () => {
    const fromPhoneNumber = '123';
    const toPhoneNumber = '456';
    const script = {
      content: {
        relays: [{
          for: 'From',
          as: 'From',
          with: 'To'
        }]
      }
    };

    const stubRelay = {
      id: 2,
      experienceId: 20,
      tripId: 100,
      forRoleName: 'From',
      asRoleName: 'From',
      withRoleName: 'To',
      update: () => {}
    };

    beforeEach(() => {
      sandbox.stub(RelayController, 'scriptForRelay').resolves(script);
      sandbox.stub(TwilioUtil, 'getRelayForExistingOrNewTrip').resolves(stubRelay);
      sandbox.stub(stubRelay, 'update');
    });

    it('handles incoming text message for existing trip', async () => {
      const result = await (
        TwilioMessageHandler.handleIncomingMessage(
          fromPhoneNumber, toPhoneNumber, 'incomïng mêssage', []));

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
            to_role_name: 'To',
            reply_needed: true
          }
        }]);
    });

    it('handles incoming MMS image for existing trip', async () => {
      const result = await (
        TwilioMessageHandler.handleIncomingMessage(
          fromPhoneNumber, toPhoneNumber, null,
          [{ url: 'http://test/image.jpg', contentType: 'image/jpg' }]));

      assert.strictEqual(result, true);
      sinon.assert.calledOnce(KernelController.applyAction);
      assert.deepStrictEqual(
        KernelController.applyAction.firstCall.args,
        [100, {
          name: 'send_image',
          params: {
            from_role_name: 'From',
            image: 'http://test/image.jpg',
            from_relay_id: 2,
            to_role_name: 'To',
            reply_needed: true
          }
        }]);
    });

    it('handles message with text and mms for existing trip', async () => {
      const result = await TwilioMessageHandler.handleIncomingMessage(
        fromPhoneNumber, toPhoneNumber, 'text',
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
