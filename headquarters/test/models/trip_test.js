const moment = require('moment');

const models = require('../../src/models');
const TestUtil = require('../util');
const { assertValidation } = require('./utils');

describe('Trip', () => {
  let trip;

  beforeEach(() => {
    trip = models.Trip.build({
      createdAt: moment.utc(),
      updatedAt: moment.utc(),
      orgId: 100,
      experienceId: 3,
      scriptId: 1,
      groupId: 2,
      title: 'Trip',
      date: '2018-01-01'
    });
  });

  it('validates with all fields present', async () => {
    await trip.validate();
  });

  it('requires an org', async () => {
    trip.orgId = null;
    await assertValidation(trip, { orgId: 'must be present' });
  });

  it('requires an experience', async () => {
    trip.experienceId = null;
    await assertValidation(trip, { experienceId: 'must be present' });
  });

  it('requires a script', async () => {
    trip.scriptId = null;
    await assertValidation(trip, { scriptId: 'must be present' });
  });

  it('requires a date', async () => {
    trip.date = null;
    await assertValidation(trip, { date: 'must be present' });
  });

  it('requires a title', async () => {
    trip.title = '';
    await assertValidation(trip, { title: 'must be present' });
  });

  it('allows values', async () => {
    trip.values = { value: 2, another: 'abc' };
    await trip.validate();
  });

  it('requires values to be an object', async () => {
    trip.values = 'abc';
    await assertValidation(trip, { values: 'must be an object' });
    trip.values = [1, 2, 3];
    await assertValidation(trip, { values: 'must be an object' });
  });

  it('allows schedule', async () => {
    trip.schedule = { value: 2, another: 'abc' };
    await trip.validate();
  });

  it('allows history', async () => {
    trip.history = { value: 2, another: 'abc' };
    await trip.validate();
  });

  it('prevents changing associations', async () => {
    const testTrip = await TestUtil.createDummyTrip();
    testTrip.experienceId = 2;
    testTrip.scriptId = 3;
    await assertValidation(testTrip, {
      experienceId: '(noUpdateAttributes): `experienceId` cannot be updated due to `readOnly` constraint.',
      scriptId: '(noUpdateAttributes): `scriptId` cannot be updated due to `readOnly` constraint.'
    });
  });
});
