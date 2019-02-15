const fs = require('fs');
const path = require('path');
const assert = require('assert');
const yaml = require('js-yaml');

const config = require('../../src/config');
const models = require('../../src/models');
const ExperienceController = require('../../src/controllers/experience');
const TwilioCallHandler = require('../../src/handlers/twilio_call');
const TestUtil = require('../util');

const examplePath = path.join(__dirname, '../../examples/phonetree.yaml');
const example = yaml.safeLoad(fs.readFileSync(examplePath, 'utf8'));

describe('PhoneTreeExample', () => {

  let script;
  let trailhead;

  beforeEach(async () => {
    config.getTwilioClient().incomingPhoneNumbers.list.resolves([{
      smsUrl: `${config.env.TWILIO_HOST}/url`,
      phoneNumber: '+13334445555'
    }]);
    script = await TestUtil.createScriptWithContent(example);
    trailhead = (
      await ExperienceController.ensureTrailheads(script.experienceId)
    )[0];
  });

  it('runs through yes path', async () => {
    // Start with an incoming call to the trailhead.
    const twiml1 = await TwilioCallHandler.handleIncomingCall('6667778888',
      trailhead.relayPhoneNumber);

    // Test greeting is returned
    assert(twiml1.toString().indexOf('<Say voice="alice">Greetings!! Would you like a refreshing beverage?</Say>') > -1);

    // Test trip was created
    const trip = await models.Trip.find({ where: { scriptId: script.id } });
    assert(trip);

    // Handle response
    const twiml2 = await TwilioCallHandler.handleCallResponse(
      trailhead.id, trip.id, 123, 'QUERY-BEVERAGE', 'normal', 'yes', false);

    assert(twiml2.toString().indexOf('<Say voice="alice">Here you go!</Say>') > -1);
  });

  it('runs through no path', async () => {
    // Start with an incoming call to the trailhead.
    const twiml1 = await TwilioCallHandler.handleIncomingCall('6667778888',
      trailhead.relayPhoneNumber);

    // Test greeting is returned
    assert(twiml1.toString().indexOf('<Say voice="alice">Greetings!! Would you like a refreshing beverage?</Say>') > -1);

    // Test trip was created
    const trip = await models.Trip.find({ where: { scriptId: script.id } });
    assert(trip);

    // Handle response
    const twiml2 = await TwilioCallHandler.handleCallResponse(
      trailhead.id, trip.id, 123, 'QUERY-BEVERAGE', 'normal', 'no', false);

    assert(twiml2.toString().indexOf('<Say voice="alice">Next time!</Say>') > -1);
  });
});
