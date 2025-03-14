const _ = require('lodash');
const moment = require('moment-timezone');

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
  countryCode: 1
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
  revision: 1,
  isActive: true,
  isArchived: false
};

const dummyUserFields = {
  email: 'test@test.com',
  passwordHash: '123',
  firstName: 'test'
};

async function createDummyOrg() {
  return await models.Org.create(Object.assign({
    createdAt: moment.utc()
  }, dummyOrgFields));
}

async function createDummyExperience() {
  const org = await createDummyOrg();
  return await models.Experience.create(Object.assign({
    orgId: org.id,
    createdAt: moment.utc()
  }, dummyExperienceFields));
}

async function createDummyUser(orgId) {
  const user = await models.User.create(Object.assign({
    createdAt: moment.utc()
  }, dummyUserFields));
  // Create role so user is authorized
  await models.OrgRole.create({ userId: user.id, orgId: orgId });
  return user;
}

async function createScriptWithContent(scriptContent) {
  const experience = await createDummyExperience();
  const scriptFields = Object.assign({}, dummyScriptFields, {
    orgId: experience.orgId,
    experienceId: experience.id,
    content: scriptContent,
    createdAt: moment.utc(),
    updatedAt: moment.utc()  
  });

  const script = models.Script.build(scriptFields);

  try {
    await script.validate();
  } catch (err) {
    if (_.get(err, 'errors[0].original.errors')) {
      const errorStrs = err.errors[0].original.errors
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

async function createDummyTripForScript(script, variantNames) {
  const trip = await TripsController.createTrip(script.experienceId, 'test',
    variantNames || []);
  // Start to get to right scene.
  await TripResetHandler.resetToStart(trip.id);
  await trip.reload();
  return trip;
}

async function createDummyRelayService(phoneNumber='+12223334444', isShared=false) {
  return await models.RelayService.create({
    stage: 'test',
    title: 'Test',
    phoneNumber: phoneNumber,
    sid: 'MG1234',
    isShared: isShared,
    isActive: true
  });
}

async function createDummyEntrywayForScript(script, phoneNumber='+12223334444') {
  const relayService = await createDummyRelayService(phoneNumber);
  return await models.RelayEntryway.create({
    orgId: script.orgId,
    experienceId: script.experienceId,
    relayServiceId: relayService.id,
    stage: 'test',
    keyword: '',
    welcome: 'Welcome to the test experience!'
  });
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
  createDummyEntrywayForScript,
  createDummyExperience,
  createDummyOrg,
  createDummyTrip,
  createDummyTripForScript,
  createDummyRelayService,
  createDummyScript,
  createDummyUser,
  createExample,
  createScriptWithContent
};

module.exports = TestUtil;
