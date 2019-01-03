const _ = require('lodash');
const moment = require('moment');

const TripsController = require('../src/controllers/trips');
const models = require('../src/models');

const dummyOrgFields = {
  id: 100,
  name: 'org',
  title: 'Org'
};

const dummyExperienceFields = {
  id: 1,
  orgId: 100,
  name: 'dummy',
  title: 'dummy',
  timezone: 'US/Pacific',
};

const dummyScriptFields = {
  orgId: 100,
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

async function createDummyOrg() {
  return await models.Org.create(dummyOrgFields);
}

async function createDummyExperience() {
  await createDummyOrg();
  return await models.Experience.create(dummyExperienceFields);
}

async function createDummyScript() {
  await createDummyExperience();
  return await models.Script.create(dummyScriptFields);
}

async function createDummyTrip() {
  const script = await createDummyScript();
  return createDummyTripForScript(script);
}

async function createDummyGroup() {
  const script = await createDummyScript();
  const today = moment.utc().format('YYYY-MM-DD');
  return await models.Group.create({
    orgId: script.orgId,
    experienceId: script.experienceId,
    scriptId: script.id,
    date: today
  });
}

async function createDummyGroupForScript(script) {
  const today = moment.utc().format('YYYY-MM-DD');
  return await models.Group.create({
    orgId: script.orgId,
    experienceId: script.experienceId,
    scriptId: script.id,
    date: today
  });
}

async function createDummyTripForScript(script, variantNames) {
  const group = await createDummyGroupForScript(script);
  const departureName = _.get(script, 'content.departures[0].name') || 'T1';
  return await TripsController.createTrip(
    group.id, 'test', departureName, variantNames || []);
}

const TestUtil = {
  createDummyExperience,
  createDummyGroup,
  createDummyGroupForScript,
  createDummyOrg,
  createDummyTrip,
  createDummyTripForScript,
  createDummyScript
};

module.exports = TestUtil;
