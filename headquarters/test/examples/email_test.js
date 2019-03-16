const fs = require('fs');
const path = require('path');
const assert = require('assert');
const sinon = require('sinon');
const yaml = require('js-yaml');

const config = require('../../src/config');
const models = require('../../src/models');
const TripActionController = require('../../src/controllers/trip_action');
const TestUtil = require('../util');

const examplePath = path.join(__dirname, '../../examples/email.yaml');
const example = yaml.safeLoad(fs.readFileSync(examplePath, 'utf8'));

describe('EmailExample', () => {

  let script;
  let trip;

  beforeEach(async () => {
    script = await TestUtil.createScriptWithContent(example);
    trip = await TestUtil.createDummyTripForScript(script);
    const user = await models.User.create({
      orgId: script.orgId,
      experienceId: script.experienceId,
      firstName: 'Phil',
      email: 'phil@paypalmafia.com',
      isActive: true
    });
    await models.Profile.create({
      orgId: script.orgId,
      experienceId: script.experienceId,
      userId: user.id,
      roleName: 'player',
      isActive: true
    });
    await models.Player.update({ userId: user.id }, {
      where: {
        tripId: trip.id,
        roleName: 'player'
      }
    });
  });

  it('sends email via sendgrid', async () => {
    await TripActionController.applyAction(trip.id, {
      name: 'send_email',
      params: { email_name: 'email-1' }
    });

    // Test email sent
    sinon.assert.calledOnce(config.getSendgridClient().send);
    assert.deepStrictEqual(config.getSendgridClient().send.firstCall.args, [{
      from: 'system@system.com',
      to: 'phil@paypalmafia.com',
      subject: 'test',
      text: '\nHello there!\n',
      html: '<p>Hello there!</p>\n',
      cc: undefined,
      bcc: undefined
    }]);
  });
});
