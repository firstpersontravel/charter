const assert = require('assert');
const sinon = require('sinon');

const RelayController = require('../../src/controllers/relay');
const RelayTrailheadController = require(
  '../../src/controllers/relay_trailhead');
const RelaysController = require('../../src/controllers/relays');
const TripActionController = require('../../src/controllers/trip_action');
const TwilioMessageHandler = require('../../src/handlers/twilio_message');

const sandbox = sinon.sandbox.create();

describe('TwilioMessageHandler', () => {

  afterEach(() => {
    sandbox.restore();
  });

  describe('#handleIncomingMessage', () => {

    describe('existing trip', () => {

      // Stub fetching relay and participant
      const script = {
        content: {
          relays: [{
            for: 'From',
            with: 'To',
            sms_in: true,
            sms_out: true
          }]
        }
      };
      const relaySentinel = {
        id: 2,
        forRoleName: 'From',
        asRoleName: 'From',
        withRoleName: 'To',
        scriptName: 'script'
      };
      const participantSentinel = { playthroughId: 100 };

      beforeEach(() => {
        sandbox.stub(RelayController, 'scriptForRelay').resolves(script);
        sandbox
          .stub(RelaysController, 'findWithParticipantByNumber')
          .resolves([relaySentinel, participantSentinel]);
        // Stub applying action
        sandbox.stub(TripActionController, 'applyAction').resolves();
      });

      it('handles incoming text message', async () => {
        const result = await (
          TwilioMessageHandler.handleIncomingMessage(
            '123', '456', 'incomïng mêssage', []));
        assert.strictEqual(result, undefined);
        sinon.assert.calledOnce(TripActionController.applyAction);
        assert.deepStrictEqual(
          TripActionController.applyAction.firstCall.args,
          [100, {
            name: 'send_message',
            params: {
              from_role_name: 'From',
              message_content: 'incomïng mêssage',
              message_type: 'text',
              suppress_relay_id: 2,
              to_role_name: 'To'
            }
          }]);
      });

      it('handles incoming MMS image', async () => {
        const result = await (
          TwilioMessageHandler.handleIncomingMessage(
            '123', '456', null,
            [{ url: 'http://test/image.jpg', contentType: 'image/jpg' }]));
        assert.strictEqual(result, undefined);
        sinon.assert.calledOnce(TripActionController.applyAction);
        assert.deepStrictEqual(
          TripActionController.applyAction.firstCall.args,
          [100, {
            name: 'send_message',
            params: {
              from_role_name: 'From',
              message_content: 'http://test/image.jpg',
              message_type: 'image',
              suppress_relay_id: 2,
              to_role_name: 'To'
            }
          }]);
      });

      it('handles message with text and mms', async () => {
        const result = await TwilioMessageHandler.handleIncomingMessage(
          '123', '456', 'text',
          [{ url: 'http://test/image.jpg', contentType: 'image/jpg' }]);
        assert.strictEqual(result, undefined);
        sinon.assert.calledTwice(TripActionController.applyAction);
        assert.deepStrictEqual(
          TripActionController.applyAction.firstCall.args[1]
            .params.message_type, 'text');
        assert.deepStrictEqual(
          TripActionController.applyAction.secondCall.args[1]
            .params.message_type, 'image');
      });
    });

    describe('new trip', () => {

      // Stub fetching relay and participant
      const script = {
        content: {
          relays: [{
            for: 'From',
            with: 'To',
            sms_in: true,
            sms_out: true,
            trailhead: true
          }]
        }
      };
      const relaySentinel = {
        id: 2,
        forRoleName: 'From',
        asRoleName: 'From',
        withRoleName: 'To',
        scriptName: 'script'
      };

      it('create a new trip on a message', async () => {
        const playthroughSentinel = { id: 4 };
        sandbox.stub(RelayController, 'scriptForRelay').resolves(script);
        sandbox
          .stub(RelaysController, 'findWithParticipantByNumber')
          .resolves([relaySentinel, null]);
        // Stub applying action
        sandbox.stub(TripActionController, 'applyAction').resolves();
        sandbox.stub(RelayTrailheadController, 'createTrip').resolves(playthroughSentinel);

        await TwilioMessageHandler.handleIncomingMessage(
          '123', '456', 'test', []);
        sinon.assert.calledWith(RelayTrailheadController.createTrip,
          relaySentinel, '123');
        assert.deepStrictEqual(
          TripActionController.applyAction.firstCall.args,
          [4, {
            name: 'send_message',
            params: {
              from_role_name: 'From',
              message_content: 'test',
              message_type: 'text',
              suppress_relay_id: 2,
              to_role_name: 'To'
            }
          }]);
      });

    });
  });
});
