const _ = require('lodash');
const moment = require('moment');

const ScriptCore = require('fptcore/src/cores/script');

const TripsController = require('../src/controllers/trips');
const TripResetHandler = require('../src/handlers/trip_reset');
const models = require('../src/models');

const dummyOrgFields = {
  name: 'org',
  title: 'Org'
};

const dummyExperienceFields = {
  name: 'dummy',
  title: 'dummy',
  timezone: 'US/Pacific',
};

const dummyContent = {
  meta: { version: ScriptCore.CURRENT_VERSION },
  roles: [{
    name: 'Dummy',
    title: 'Dummy'
  }],
  scenes: [{
    name: 'SCENE-MAIN',
    title: 'Main'
  }]
};

const dummyScriptFields = {
  createdAt: moment.utc(),
  updatedAt: moment.utc(),
  revision: 1,
  isActive: true,
  isArchived: false
};

async function createDummyOrg() {
  return await models.Org.create(dummyOrgFields);
}

async function createDummyExperience() {
  const org = await createDummyOrg();
  return await models.Experience.create(Object.assign({
    orgId: org.id
  }, dummyExperienceFields));
}

async function createScriptWithContent(scriptContent) {
  const experience = await createDummyExperience();
  const scriptFields = Object.assign({}, dummyScriptFields, {
    orgId: experience.orgId,
    experienceId: experience.id,
    content: scriptContent
  });

  const script = models.Script.build(scriptFields);

  try {
    await script.validate();
  } catch (err) {
    if (_.get(err, 'errors[0].__raw.errors')) {
      const errorStrs = err.errors[0].__raw.errors
        .map(e => `${e.path}: ${e.message}`)
        .join(' ');
      throw new Error(errorStrs);
    }
    throw err;
  }

  await script.save();
  return script;
}

async function createDummyScript() {
  return await createScriptWithContent(dummyContent);
}

async function createDummyTrip() {
  const script = await createDummyScript();
  return await createDummyTripForScript(script);
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
  const trip = await TripsController.createTrip(group.id, 'test',
    variantNames || []);
  // Start to get to right scene.
  await TripResetHandler.resetToStart(trip.id);
  return trip;
}

async function createExample(example) {
  const content = Object.assign({
    meta: { version: ScriptCore.CURRENT_VERSION }
  }, example.content);
  const script = await createScriptWithContent(content);
  for (const asset of example.assets || []) {
    await models.Asset.create({
      createdAt: moment.utc(),
      updatedAt: moment.utc(),
      type: asset.type,
      data: asset.data,
      name: 'example',
      orgId: script.orgId,
      experienceId: script.experienceId
    });
  }
  return script;
}

const TestUtil = {
  createDummyExperience,
  createDummyGroup,
  createDummyGroupForScript,
  createDummyOrg,
  createDummyTrip,
  createDummyTripForScript,
  createDummyScript,
  createExample,
  createScriptWithContent
};

module.exports = TestUtil;
