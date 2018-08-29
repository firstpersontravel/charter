const _ = require('lodash');
const moment = require('moment');

const TripsController = require('../src/controllers/trips');
const models = require('../src/models');

const dummyScriptFields = {
  name: 'dummy',
  title: 'dummy',
  timezone: 'US/Pacific',
  version: 1,
  content: {
    roles: [{
      name: 'Dummy',
      starting_page: 'PAGE'
    }],
    scenes: [{
      name: 'SCENE-MAIN',
      title: 'Main'
    }]
  }
};

async function createDummyPlaythrough() {
  const script = await models.Script.create(dummyScriptFields);
  return createDummyTripForScript(script);
}

async function createDummyTripForScript(script, variantNames) {
  const today = moment.utc().format('YYYY-MM-DD');
  const group = await models.Group.create({
    scriptId: script.id,
    date: today
  });
  const departureName = _.get(script, 'content.departures[0].name') || 'T1';
  return await TripsController.createWithDefaults(
    group.id, 'test', departureName, variantNames || []);
}

const TestUtil = {
  createDummyPlaythrough: createDummyPlaythrough,
  createDummyTripForScript: createDummyTripForScript
};

module.exports = TestUtil;
