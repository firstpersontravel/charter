const assert = require('assert');
const sinon = require('sinon');
const twilio = require('twilio');

const { sandbox } = require('../mocks');
const config = require('../../src/config');
const models = require('../../src/models');
const RelayController = require('../../src/controllers/relay');
const RelaysController = require('../../src/controllers/relays');
const KernelController = require('../../src/kernel/kernel');
const TwilioCallHandler = require('../../src/handlers/twilio_call');

describe('TwilioCallHandler', () => {
  describe('#_triggerEventAndGatherTwiml', () => {
    const stubRelay = { id: 100, experienceId: 10 };
    const stubEvent = { event: true };

    it('returns dial', async () => {
      const stubOppositeRelay = {
        relayPhoneNumber: '+18887776666'
      };
      const stubPlayer = {
        participantId: 9,
        participant: { phoneNumber: '+19995551212'}
      };
      // Stub searching for opposite relay
      sandbox
        .stub(RelayController, 'findSiblings')
        .resolves([stubOppositeRelay]);
      // Stub searching for player
      sandbox
        .stub(models.Player, 'findOne')
        .resolves(stubPlayer);
      // Apply event returns a dial operation
      sandbox
        .stub(KernelController, 'applyEvent')
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
      sinon.assert.calledOnce(models.Player.findOne);
      assert.deepStrictEqual(
        models.Player.findOne.firstCall.args, [{
          where: { tripId: 1, roleName: 'ToPerson' },
          include: [{ model: models.Participant, as: 'participant' }]
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
        .stub(KernelController, 'applyEvent')
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
      // Apply event returns a play operation
      sandbox
        .stub(KernelController, 'applyEvent')
        .resolves({
          resultOps: [{
            operation: 'twiml',
            clause: 'play',
            media: 'http://twilio.media/test_org/test_script/audio.mp3'
          }]
        });

      const twiml = await (
        TwilioCallHandler._triggerEventAndGatherTwiml(1, stubRelay, stubEvent)
      );

      // Assert response
      assert.strictEqual(
        twiml.toString(),
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Response>' +
        '<Play>http://twilio.media/test_org/test_script/audio.mp3</Play>' +
        '</Response>');
    });

    it('returns gather', async () => {
      // Apply event returns a play operation
      sandbox
        .stub(KernelController, 'applyEvent')
        .resolves({
          resultOps: [{
            operation: 'twiml',
            clause: 'gather',
            clipName: 'CLIP-123',
            subclause: {
              clause: 'play',
              media: 'http://twilio.media/test_org/test_script/audio.mp3'
            }
          }]
        });

      const twiml = await (
        TwilioCallHandler._triggerEventAndGatherTwiml(1, stubRelay, stubEvent)
      );

      // Assert response
      assert.strictEqual(
        twiml.toString(),
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Response><Gather input="dtmf speech" timeout="10" ' +
        'action="http://twilio.test/endpoints/twilio/calls/response' +
        '?relay=100&amp;trip=1&amp;clip=CLIP-123" ' +
        'partialResultCallback=' +
        '"http://twilio.test/endpoints/twilio/calls/response?' +
        'relay=100&amp;trip=1&amp;clip=CLIP-123&amp;partial=true">' +
        '<Play>http://twilio.media/test_org/test_script/audio.mp3</Play>' +
        '</Gather></Response>');
    });
  });

  describe('#handleIncomingCall', () => {
    const stubRelay = { asRoleName: 'Player', withRoleName: 'Recipient', update: () => {} };
    const stubScript = {};
    const stubSpec = {};
    const stubTripId = 123;

    beforeEach(() => {
      sandbox.stub(stubRelay, 'update');
    });

    it('hangs up if relay not found', async () => {
      sandbox.stub(RelaysController, 'findByNumber').resolves(null);

      const res = await TwilioCallHandler.handleIncomingCall(
        '+11111111111', '+12222222222');

      // Test returns twiml sentinel
      assert.strictEqual(
        res.toString(),
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Response><Say>No Charter relay found for this number.' +
        '</Say></Response>');
    });

    it('hangs up if no spec found', async () => {
      sandbox.stub(RelaysController, 'findByNumber').resolves(stubRelay);
      sandbox.stub(RelayController, 'scriptForRelay').resolves(stubScript);
      sandbox.stub(RelayController, 'specForRelay').returns(null);
  
      const res = await TwilioCallHandler.handleIncomingCall(
        '+11111111111', '+12222222222');

      // Test returns twiml sentinel
      assert.strictEqual(
        res.toString(),
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Response><Say>No Charter relay spec found for this number.' +
        '</Say></Response>');
    });

    it('returns gathered twiml', async () => {
      const twimlSentinel = new twilio.twiml.VoiceResponse();
      twimlSentinel.say({}, 'message');
  
      sandbox.stub(RelaysController, 'findByNumber').resolves(stubRelay);
      sandbox.stub(RelayController, 'scriptForRelay').resolves(stubScript);
      sandbox.stub(RelayController, 'specForRelay').returns(stubSpec);
  
      // Return twiml
      sandbox
        .stub(TwilioCallHandler, '_triggerEventAndGatherTwiml')
        .resolves(twimlSentinel);

      const res = await TwilioCallHandler.handleIncomingCall(
        '+11111111111', '+12222222222');

      // Test returns twiml sentinel
      assert.strictEqual(res, twimlSentinel);

      // Test event was called properly
      sinon.assert.calledWith(
        TwilioCallHandler._triggerEventAndGatherTwiml.getCall(0),
        stubTripId, stubRelay, {
          type: 'call_received',
          from: 'Player',
          to: 'Recipient'
        });
    });

    it('plays default message if no twiml was gathered', async () => {
      sandbox.stub(RelaysController, 'findByNumber').resolves(stubRelay);
      sandbox.stub(RelayController, 'scriptForRelay').resolves(stubScript);
      sandbox.stub(RelayController, 'specForRelay').returns(stubSpec);
  
      // Return twiml
      sandbox
        .stub(TwilioCallHandler, '_triggerEventAndGatherTwiml')
        .resolves(new twilio.twiml.VoiceResponse());

      const res = await TwilioCallHandler.handleIncomingCall(
        '+11111111111', '+12222222222');

      // Test returns twiml sentinel
      assert.strictEqual(
        res.toString(),
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Response><Say>No Charter behavior handled this incoming call.' +
        '</Say></Response>');

      // Test event was called properly
      sinon.assert.calledWith(
        TwilioCallHandler._triggerEventAndGatherTwiml.getCall(0),
        stubTripId, stubRelay, {
          type: 'call_received',
          from: 'Player',
          to: 'Recipient'
        });
    });
  });

  describe('#handleCallResponse', () => {
    const relayId = 1;
    const tripId = 2;
    const callSid = 3;
    const clipName = 'clip';
    const stubRelay = { id: 1 };

    const twimlSentinel = new twilio.twiml.VoiceResponse();
    twimlSentinel.say({}, 'message');

    beforeEach(() => {
      sandbox.stub(TwilioCallHandler, '_interruptCall').resolves();
      sandbox.stub(models.Relay, 'findByPk').resolves(stubRelay);
    });

    it('returns twiml if final', async () => {
      // Return twiml
      sandbox
        .stub(TwilioCallHandler, '_triggerEventAndGatherTwiml')
        .resolves(twimlSentinel);

      const res = await TwilioCallHandler.handleCallResponse(relayId, tripId,
        callSid, clipName, 'abc', false);

      // Test returns twiml sentinel
      assert.strictEqual(res, twimlSentinel);

      // Test event was called properly
      sinon.assert.calledWith(
        TwilioCallHandler._triggerEventAndGatherTwiml.getCall(0),
        tripId, stubRelay, {
          type: 'clip_answered',
          clip: 'clip',
          partial: false,
          response: 'abc'
        });

      // Call not interrupted
      sinon.assert.notCalled(TwilioCallHandler._interruptCall);
    });

    it('returns hangup if no twiml returned', async () => {
      // Return twiml
      sandbox
        .stub(TwilioCallHandler, '_triggerEventAndGatherTwiml')
        .resolves(new twilio.twiml.VoiceResponse());

      const res = await TwilioCallHandler.handleCallResponse(relayId, tripId,
        callSid, clipName, 'abc', false);

      // Test returns twiml sentinel
      assert.strictEqual(res.toString(), '<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>');

      // Call not interrupted
      sinon.assert.notCalled(TwilioCallHandler._interruptCall);
    });

    it('interrupts call if partial', async () => {
      // Return twiml
      sandbox
        .stub(TwilioCallHandler, '_triggerEventAndGatherTwiml')
        .resolves(twimlSentinel);

      const res = await TwilioCallHandler.handleCallResponse(relayId, tripId,
        callSid, clipName, 'abc', true);

      // Test returns empty voice response -- not the actual twiml is sent
      // to the interrupt call endpoint
      assert.strictEqual(res.toString(), '<?xml version="1.0" encoding="UTF-8"?><Response/>');

      // Test event was called properly
      sinon.assert.calledWith(
        TwilioCallHandler._triggerEventAndGatherTwiml.getCall(0),
        tripId, stubRelay, {
          type: 'clip_answered',
          clip: 'clip',
          partial: true,
          response: 'abc'
        });

      // Call interrupted
      sinon.assert.calledWith(TwilioCallHandler._interruptCall.getCall(0),
        callSid, twimlSentinel);
    });
  });

  describe('#_interruptCall', () => {
    it('sends interrupt to twilio', async () => {
      const twimlSentinel = new twilio.twiml.VoiceResponse();
      twimlSentinel.say({}, 'message');
      const twimlBase64 = encodeURIComponent(
        Buffer.from(twimlSentinel.toString()).toString('base64'));
      const base64Url = (
        `${config.env.HQ_TWILIO_HOST}/endpoints/twilio/` +
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
