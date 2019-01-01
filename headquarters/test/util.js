const _ = require('lodash');
const moment = require('moment');

const TripsController = require('../src/controllers/trips');
const models = require('../src/models');

const dummyExperienceFields = {
  id: 1,
  name: 'dummy',
  title: 'dummy',
  timezone: 'US/Pacific',
};

const dummyScriptFields = {
  experienceId: 1,
  revision: 1,
  contentVersion: 1,
  content: {
    roles: [{
      name: 'Dummy'
    }],
    scenes: [{
      name: 'SCENE-MAIN',
      title: 'Main'
    }]
  },
  isActive: true,
  isArchived: false
};

async function createDummyExperience() {
  return await models.Experience.create(dummyExperienceFields);
}

async function createDummyTrip() {
  await createDummyExperience();
  const script = await models.Script.create(dummyScriptFields);
  return createDummyTripForScript(script);
}

async function createDummyTripForScript(script, variantNames) {
  const today = moment.utc().format('YYYY-MM-DD');
  const group = await models.Group.create({
    experienceId: script.experienceId,
    scriptId: script.id,
    date: today
  });
  const departureName = _.get(script, 'content.departures[0].name') || 'T1';
  return await TripsController.createTrip(
    group.id, 'test', departureName, variantNames || []);
}

const TestUtil = {
  createDummyExperience: createDummyExperience,
  createDummyTrip: createDummyTrip,
  createDummyTripForScript: createDummyTripForScript
};

module.exports = TestUtil;
