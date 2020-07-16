const assert = require('assert');
const httpMocks = require('node-mocks-http');
const sinon = require('sinon');
const twilio = require('twilio');

const ScriptCore = require('fptcore/src/cores/script');

const { sandbox } = require('../mocks');
const twilioRoutes = require('../../src/routes/twilio');
const models = require('../../src/models');
const KernelController = require('../../src/kernel/kernel');
const TwilioCallHandler = require('../../src/handlers/twilio_call');
const TestUtil = require('../util');

const scriptContent = {
  meta: { version: ScriptCore.CURRENT_VERSION },
  roles: [
    { name: 'Actor', title: 'Actor' },
    { name: 'Player', title: 'Player' }
  ],
  relays: [
    { name: 'r1', for: 'Actor', as: 'Actor', with: 'Player' },
    { name: 'r2', for: 'Player', as: 'Player', with: 'Actor', entryway: true }
  ]
};

describe('twilioRoutes', () => {

  let trip;
  let travelerParticipant;
  let actorParticipant;
  let travelerRelay;

  beforeEach(async () => {
    const script = await TestUtil.createScriptWithContent(scriptContent);
    trip = await TestUtil.createDummyTripForScript(script, []);
    travelerParticipant = await models.Participant.create({
      orgId: trip.orgId,
      experienceId: trip.experienceId,
      firstName: 'tester1',
      phoneNumber: '1111111111',
      isArchived: false,
      isActive: true
    });
    actorParticipant = await models.Participant.create({
      orgId: trip.orgId,
      experienceId: trip.experienceId,
      firstName: 'actor2',
      phoneNumber: '2222222222',
      isArchived: false,
      isActive: true
    });

    await models.Player.update(
      { participantId: travelerParticipant.id },
      { where: { tripId: trip.id, roleName: 'Player' } });
    await models.Player.update(
      { participantId: actorParticipant.id },
      { where: { tripId: trip.id, roleName: 'Actor' } });

    travelerRelay = await models.Relay.create({
      orgId: trip.orgId,
      experienceId: trip.experienceId,
      stage: 'test',
      isActive: true,
      forRoleName: 'Player',
      asRoleName: 'Player',
      withRoleName: 'Actor',
      relayPhoneNumber: '9999999999',
      participantPhoneNumber: ''
    });
    
    await models.Relay.create({
      orgId: trip.orgId,
      experienceId: trip.experienceId,
      stage: 'test',
      isActive: true,
      forRoleName: 'Actor',
      asRoleName: 'Actor',
      withRoleName: 'Player',
      relayPhoneNumber: '9999999998',
      participantPhoneNumber: ''
    });
  });

  describe('#incomingMessageRoute', () => {
    it('handles incoming text', async () => {
      // Create dummy request
      const req = httpMocks.createRequest({
        body: {
          SmsStatus: 'incoming',
          From: `+1${travelerParticipant.phoneNumber}`, // participant
          To: `+1${travelerRelay.relayPhoneNumber}`,   // relay
          Body: 'Reply',
          NumMedia: '0'
        }
      });
      const res = httpMocks.createResponse();

      // Stub response
      sandbox.stub(KernelController, 'applyAction').resolves(null);

      // Call the route
      await twilioRoutes.incomingMessageRoute(req, res);

      // Check called with correct args
      sinon.assert.calledOnce(KernelController.applyAction);
      const expectedAction = {
        name: 'send_text',
        params: {
          from_role_name: 'Player',
          to_role_name: 'Actor',
          content: 'Reply',
          from_relay_id: travelerRelay.id,
          reply_needed: true
        }
      };
      assert.deepEqual(
        KernelController.applyAction.firstCall.args,
        [trip.id, expectedAction]);

      // Check response
      assert.strictEqual(res.statusCode, 200);
    });
  });

  describe('#incomingCallRoute', () => {
    it('handles incoming call to start conference', async () => {
      // Create dummy request
      const req = httpMocks.createRequest({
        body: {
          CallStatus: 'ringing',
          Direction: 'inbound',
          From: `+1${travelerParticipant.phoneNumber}`,
          To: `+1${travelerRelay.relayPhoneNumber}`
        }
      });
      const res = httpMocks.createResponse();

      // We're simulating a Player call to the Player relay, so have the
      // action return a dial out to the Actor.
      sandbox.stub(KernelController, 'applyEvent').resolves({
        resultOps: [{
          operation: 'twiml',
          clause: 'dial',
          fromRoleName: 'Player',
          toRoleName: 'Actor'
        }]
      });

      // Call the route
      await twilioRoutes.incomingCallRoute(req, res);

      // Check calls made correctly
      sinon.assert.calledWith(KernelController.applyEvent, trip.id, {
        from: 'Player',
        to: 'Actor',
        type: 'call_received'
      });

      // Check response
      const expectedXml = (
        '<?xml version="1.0" encoding="UTF-8"?>' +
        // actor relay
        '<Response><Dial callerId="+19999999998" timeout="30">' + 
        // actor number
        '<Number>+12222222222</Number></Dial>' +
        '<Say>We\'re sorry, this number could not be reached.</Say>' +
        '</Response>'
      );
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res._getData(), expectedXml);
    });
  });

  describe('#outgoingCallRoute', () => {
    beforeEach(() => {
      // We're simulating an outgoing call from the Actor to the Player,
      // so the player's phone is dialing -- we need to add the Actor phone.
      sandbox.stub(KernelController, 'applyEvent').resolves({
        resultOps: [{
          operation: 'twiml',
          clause: 'dial',
          fromRoleName: 'Player',
          toRoleName: 'Actor'
        }]
      });
    });

    it('handles outgoing call to start conference', async () => {
      // Create dummy request
      const req = httpMocks.createRequest({
        query: { trip: trip.id, relay: travelerRelay.id },
        body: {
          CallStatus: 'in-progress',
          AnsweredBy: 'machine_beep_end',
          Direction: 'outbound-api',
          From: `+1${travelerRelay.relayPhoneNumber}`,  // Player relay
          To: `+1${travelerParticipant.phoneNumber}`     // Player participant
        }
      });
      const res = httpMocks.createResponse();

      await twilioRoutes.outgoingCallRoute(req, res);

      // Check calls made correctly
      sinon.assert.calledOnce(KernelController.applyEvent);
      assert.deepStrictEqual(
        KernelController.applyEvent.firstCall.args,
        [trip.id, {
          from: 'Actor',
          to: 'Player',
          type: 'call_answered',
          answered_by_machine: true
        }]
      );

      // Check response
      const expectedXml = (
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<Response><Dial callerId="+19999999998" timeout="30">' + 
        '<Number>+12222222222</Number></Dial>' +
        '<Say>We\'re sorry, this number could not be reached.</Say>' +
        '</Response>'
      );
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res._getData(), expectedXml);
    });

    it('sets answered_by_machine when answered by a human', async () => {
      // Create dummy request
      const req = httpMocks.createRequest({
        query: { trip: trip.id, relay: travelerRelay.id },
        body: {
          CallStatus: 'in-progress',
          AnsweredBy: 'human',
          Direction: 'outbound-api',
          From: `+1${travelerRelay.relayPhoneNumber}`,  // Player relay
          To: `+1${travelerParticipant.phoneNumber}`     // Player participant
        }
      });
      const res = httpMocks.createResponse();

      await twilioRoutes.outgoingCallRoute(req, res);

      // Check 'answered_by_machine' set in call
      const applyEventStub = KernelController.applyEvent;
      sinon.assert.calledOnce(applyEventStub);
      assert.deepStrictEqual(
        applyEventStub.firstCall.args[1].answered_by_machine, false);
    });
  });

  describe('#callResponseRoute', () => {
    // Create a dummy response to check for.  
    const twimlSentinel = new twilio.twiml.VoiceResponse();
    twimlSentinel.say({}, 'response message');

    // Dummy stub
    const stubRelay = {};

    beforeEach(() => {
      // don't interrupt
      sandbox.stub(TwilioCallHandler, '_interruptCall').resolves();
      // basic twiml response
      sandbox
        .stub(TwilioCallHandler, '_triggerEventAndGatherTwiml')
        .resolves(twimlSentinel);

      // basic stub relay
      sandbox.stub(models.Relay, 'findByPk').resolves(stubRelay);
    });

    it('handles digits response', async () => {
      // Create dummy request
      const req = httpMocks.createRequest({
        query: { trip: trip.id, relay: travelerRelay.id, clip: 'CLIP-NAME' },
        body: { Digits: '123' }
      });
      const res = httpMocks.createResponse();

      // Call the route
      await twilioRoutes.callResponseRoute(req, res);

      // Assert creates proper event and sends to trigger
      assert.deepStrictEqual(
        TwilioCallHandler._triggerEventAndGatherTwiml.firstCall.args,
        [trip.id, stubRelay, {
          clip: 'CLIP-NAME',
          partial: false,
          response: '123',
          type: 'clip_answered'
        }]);
      // Call doesn't need to be interrupted
      sinon.assert.notCalled(TwilioCallHandler._interruptCall);

      // Check result
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res._getData(), twimlSentinel.toString());
    });

    it('handles final speech response', async () => {
      // Create dummy request
      const req = httpMocks.createRequest({
        query: { trip: trip.id, relay: travelerRelay.id, clip: 'CLIP-NAME' },
        body: { SpeechResult: 'test result', Confidence: 0.5 }
      });
      const res = httpMocks.createResponse();

      // Call the route
      await twilioRoutes.callResponseRoute(req, res);

      // Assert creates proper event and sends to trigger
      assert.deepStrictEqual(
        TwilioCallHandler._triggerEventAndGatherTwiml.firstCall.args,
        [trip.id, stubRelay, {
          clip: 'CLIP-NAME',
          partial: false,
          response: 'test result',
          type: 'clip_answered'
        }]);
      // Call doesn't need to be interrupted
      sinon.assert.notCalled(TwilioCallHandler._interruptCall);

      // Check result
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res._getData(), twimlSentinel.toString());
    });

    it('handles partial speech response', async () => {
      // Create dummy request
      const req = httpMocks.createRequest({
        query: {
          trip: trip.id,
          relay: travelerRelay.id,
          clip: 'CLIP-NAME',
          partial: 'true'
        },
        body: { CallSid: '1234', UnstableSpeechResult: 'prelim result' }
      });
      const res = httpMocks.createResponse();

      // Call the route
      await twilioRoutes.callResponseRoute(req, res);

      // Assert creates proper event and sends to trigger
      assert.deepStrictEqual(
        TwilioCallHandler._triggerEventAndGatherTwiml.firstCall.args,
        [trip.id, stubRelay, {
          clip: 'CLIP-NAME',
          partial: true,
          response: 'prelim result',
          type: 'clip_answered'
        }]);
      // Call is interrupted
      sinon.assert.calledOnce(TwilioCallHandler._interruptCall);
      assert.deepStrictEqual(
        TwilioCallHandler._interruptCall.firstCall.args,
        ['1234', twimlSentinel]);

      // Check result
      const blankXml = '<?xml version="1.0" encoding="UTF-8"?><Response/>';
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res._getData(), blankXml);
    });
  });

  describe('#callInterruptRoute', () => {
    it('returns with twiml passed in query', async () => {
      const interruptTwiml = new twilio.twiml.VoiceResponse();
      interruptTwiml.say({}, 'response message');
      const twimlText = interruptTwiml.toString('ascii');
      const twimlBase64 = Buffer.from(twimlText).toString('base64');

      // Create dummy request
      const req = httpMocks.createRequest({
        query: { twiml: twimlBase64 }
      });
      const res = httpMocks.createResponse();

      // Call the route
      await twilioRoutes.callInterruptRoute(req, res);

      // Check result
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res._getData(), twimlText);
    });
  });
});
