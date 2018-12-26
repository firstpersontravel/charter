const assert = require('assert');
const fs = require('fs');
const httpMocks = require('node-mocks-http');
const path = require('path');
const sequelizeFixtures = require('sequelize-fixtures');
const sinon = require('sinon');
const twilio = require('twilio');
const yaml = require('js-yaml');

const twilioRoutes = require('../../src/routes/twilio');
const models = require('../../src/models');
const TripActionController = require('../../src/controllers/trip_action');
const TwilioCallHandler = require('../../src/handlers/twilio_call');

const sandbox = sinon.sandbox.create();

describe('twilioRoutes', () => {

  const fixturePath = path.join(__dirname, '../fixtures/relays.yaml');
  const fixtures = yaml.safeLoad(fs.readFileSync(fixturePath, 'utf8'));

  afterEach(() => {
    sandbox.restore();
  });

  beforeEach(async () => {
    await sequelizeFixtures.loadFixtures(fixtures, models);
  });

  describe('#incomingMessageRoute', () => {
    it('handles incoming text', async () => {
      // Create dummy request
      const req = httpMocks.createRequest({
        body: {
          SmsStatus: 'incoming',
          From: '+11111111111', // user
          To: '+19999999999',   // relay
          Body: 'Reply',
          NumMedia: '0'
        }
      });
      const res = httpMocks.createResponse();

      // Stub response
      sandbox.stub(TripActionController, 'applyAction').resolves(null);

      // Call the route
      await twilioRoutes.incomingMessageRoute(req, res);

      // Check called with correct args
      sinon.assert.calledOnce(TripActionController.applyAction);
      const expectedAction = {
        name: 'custom_message',
        params: {
          from_role_name: 'Player',
          to_role_name: 'Actor',
          message_type: 'text',
          message_content: 'Reply',
          suppress_relay_id: 3
        }
      };
      assert.deepEqual(
        TripActionController.applyAction.firstCall.args,
        [1, expectedAction]);

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
          From: '+11111111111', // player
          To: '+19999999999'    // player relay
        }
      });
      const res = httpMocks.createResponse();

      // We're simulating a Player call to the Player relay, so have the
      // action return a dial out to the Actor.
      sandbox.stub(TripActionController, 'applyEvent').resolves({
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
      sinon.assert.calledWith(TripActionController.applyEvent, 1, {
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
      sandbox.stub(TripActionController, 'applyEvent').resolves({
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
        query: {
          trip: 1,
          relay: 3
        },
        body: {
          CallStatus: 'in-progress',
          AnsweredBy: 'machine_beep_end',
          Direction: 'outbound-api',
          From: '+19999999999',  // Player relay
          To: '+11111111111'     // Player user
        }
      });
      const res = httpMocks.createResponse();

      await twilioRoutes.outgoingCallRoute(req, res);

      // Check calls made correctly
      sinon.assert.calledOnce(TripActionController.applyEvent);
      assert.deepStrictEqual(
        TripActionController.applyEvent.firstCall.args,
        [1, {
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
        query: { trip: '1', relay: '3' },
        body: {
          CallStatus: 'in-progress',
          AnsweredBy: 'human',
          Direction: 'outbound-api',
          From: '+19999999999',  // Player relay
          To: '+11111111111'     // Player user
        }
      });
      const res = httpMocks.createResponse();

      await twilioRoutes.outgoingCallRoute(req, res);

      // Check 'answered_by_machine' set in call
      const applyEventStub = TripActionController.applyEvent;
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
      sandbox.stub(models.Relay, 'findById').resolves(stubRelay);
    });

    it('handles final response', async () => {
      // Create dummy request
      const req = httpMocks.createRequest({
        query: { trip: '1', relay: '10', query: 'QUERY-NAME' },
        body: { SpeechResult: 'test result', Confidence: 0.5 }
      });
      const res = httpMocks.createResponse();

      // Call the route
      await twilioRoutes.callResponseRoute(req, res);

      // Assert creates proper event and sends to trigger
      assert.deepStrictEqual(
        TwilioCallHandler._triggerEventAndGatherTwiml.firstCall.args,
        [1, stubRelay, {
          query: 'QUERY-NAME',
          partial: false,
          response: 'test result',
          type: 'query_responded'
        }]);
      // Call doesn't need to be interrupted
      sinon.assert.notCalled(TwilioCallHandler._interruptCall);

      // Check result
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res._getData(), twimlSentinel.toString());
    });

    it('handles partial response', async () => {
      // Create dummy request
      const req = httpMocks.createRequest({
        query: {
          trip: '1',
          relay: '10',
          query: 'QUERY-NAME',
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
        [1, stubRelay, {
          query: 'QUERY-NAME',
          partial: true,
          response: 'prelim result',
          type: 'query_responded'
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
      const twimlBase64 = new Buffer(twimlText).toString('base64');

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
