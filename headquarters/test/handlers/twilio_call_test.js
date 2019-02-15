const assert = require('assert');
const sinon = require('sinon');
const twilio = require('twilio');

const { sandbox } = require('../mocks');
const config = require('../../src/config');
const models = require('../../src/models');
const RelayController = require('../../src/controllers/relay');
const TripActionController = require('../../src/controllers/trip_action');
const TwilioCallHandler = require('../../src/handlers/twilio_call');

describe('TwilioCallHandler', () => {
  describe('#_triggerEventAndGatherTwiml', () => {
    const stubRelay = { id: 100, experienceId: 10, departureName: 'T0' };
    const stubEvent = { event: true };

    it('returns dial', async () => {
      const stubOppositeRelay = {
        relayPhoneNumber: '8887776666'
      };
      const stubPlayer = {
        userId: 9,
        user: { phoneNumber: '9995551212'}
      };
      // Stub searching for opposite relay
      sandbox
        .stub(RelayController, 'findSiblings')
        .resolves([stubOppositeRelay]);
      // Stub searching for player
      sandbox
        .stub(models.Player, 'find')
        .resolves(stubPlayer);
      // Apply event returns a dial operation
      sandbox
        .stub(TripActionController, 'applyEvent')
        .resolves({
          resultOps: [{
            operation: 'twiml',
            clause: 'dial',
            fromRoleName: 'FromPerson',
            toRoleName: 'ToPerson'
          }]
        });

      const twiml = await (
        TwilioCallHandler._triggerEventAndGatherTwiml(1, stubRelay, stubEvent)
      );

      // Assert found relays by opposite
      sinon.assert.calledOnce(RelayController.findSiblings);
      assert.deepStrictEqual(
        RelayController.findSiblings.firstCall.args,
        [stubRelay, 'ToPerson', 'FromPerson']);
      // Assert found player by role
      sinon.assert.calledOnce(models.Player.find);
      assert.deepStrictEqual(
        models.Player.find.firstCall.args, [{
          where: { tripId: 1, roleName: 'ToPerson' },
          include: [{ model: models.User, as: 'user' }]
        }]);
      // Assert response
      assert.strictEqual(
        twiml.toString(),
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Response><Dial callerId="+18887776666" timeout="30">' +
        '<Number>+19995551212</Number></Dial>' +
        '<Say>We\'re sorry, this number could not be reached.</Say>' +
        '</Response>');
    });

    it('returns say', async () => {
      // Apply event returns a say operation
      sandbox
        .stub(TripActionController, 'applyEvent')
        .resolves({
          resultOps: [{
            operation: 'twiml',
            clause: 'say',
            voice: 'alice',
            message: 'test message'
          }]
        });

      const twiml = await (
        TwilioCallHandler._triggerEventAndGatherTwiml(1, stubRelay, stubEvent)
      );

      // Assert response
      assert.strictEqual(
        twiml.toString(),
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Response><Say voice="alice">test message</Say></Response>');
    });

    it('returns play', async () => {
      // Stubs script for media lookups
      const stubScript = {
        experience: { name: 'test_script' },
        content: {}
      };
      sandbox.stub(RelayController, 'scriptForRelay').resolves(stubScript);
      // Apply event returns a play operation
      sandbox
        .stub(TripActionController, 'applyEvent')
        .resolves({
          resultOps: [{
            operation: 'twiml',
            clause: 'play',
            media: 'audio.mp3'
          }]
        });

      const twiml = await (
        TwilioCallHandler._triggerEventAndGatherTwiml(1, stubRelay, stubEvent)
      );

      // Assert found script by role
      sinon.assert.calledOnce(RelayController.scriptForRelay);
      assert.deepStrictEqual(
        RelayController.scriptForRelay.firstCall.args, [stubRelay]);
      // Assert response
      assert.strictEqual(
        twiml.toString(),
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Response>' +
        '<Play>http://twilio.media/test_script/audio.mp3</Play>' +
        '</Response>');
    });

    it('returns gather', async () => {
      // Stubs script for media lookups
      const stubScript = {
        experience: { name: 'test_script' },
        content: {}
      };
      sandbox.stub(RelayController, 'scriptForRelay').resolves(stubScript);
      // Apply event returns a play operation
      sandbox
        .stub(TripActionController, 'applyEvent')
        .resolves({
          resultOps: [{
            operation: 'twiml',
            clause: 'gather',
            queryName: 'QUERY-123',
            queryType: 'normal',
            subclause: {
              clause: 'play',
              media: 'audio.mp3'
            }
          }]
        });

      const twiml = await (
        TwilioCallHandler._triggerEventAndGatherTwiml(1, stubRelay, stubEvent)
      );

      // Assert found script by role
      sinon.assert.calledOnce(RelayController.scriptForRelay);
      assert.deepStrictEqual(
        RelayController.scriptForRelay.firstCall.args, [stubRelay]);
      // Assert response
      assert.strictEqual(
        twiml.toString(),
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Response><Gather input="speech" ' +
        'action="http://twilio.test/endpoints/twilio/calls/response' +
        '?relay=100&amp;trip=1&amp;query=QUERY-123&amp;type=normal" ' +
        'partialResultCallback=' +
        '"http://twilio.test/endpoints/twilio/calls/response?' +
        'relay=100&amp;trip=1&amp;query=QUERY-123&amp;type=normal&amp;' +
        'partial=true">' +
        '<Play>http://twilio.media/test_script/audio.mp3</Play>' +
        '</Gather></Response>');
    });
  });

  describe('#handleIncomingCall', () => {
    it.skip('hangs up if relay not found', async () => {});

    it.skip('hangs up if no spec found', async () => {});

    it.skip('hangs up if phone-in disallowed and no voicemail', async () => {
    });

    it.skip('plays voicemail if phone-in disallowed and defined', async () => {
    });

    it.skip('returns gathered twiml', async () => {});

    it.skip('plays voicemail if no twiml was gathered', async () => {});
  });

  describe('#handleCallResponse', () => {
    it.skip('returns twiml if final', () => {});

    it.skip('interrupts call if partial', () => {});
  });

  describe('#_interruptCall', () => {
    it('sends interrupt to twilio', async () => {
      const twimlSentinel = new twilio.twiml.VoiceResponse();
      twimlSentinel.say({}, 'message');
      const twimlBase64 = encodeURIComponent(
        new Buffer(twimlSentinel.toString()).toString('base64'));
      const base64Url = (
        `${config.env.TWILIO_HOST}/endpoints/twilio/` +
        `calls/interrupt?twiml=${twimlBase64}`
      );

      await TwilioCallHandler._interruptCall('123', twimlSentinel);

      sinon.assert.calledWith(
        config.getTwilioClient().calls, '123');
      sinon.assert.calledWith(
        config.getTwilioClient().calls().update, { url: base64Url });
    });
  });
});
