const models = require('../../src/models');
const TestUtil = require('../util');
const { assertValidation } = require('./utils');

describe('Trip', () => {
  let trip;

  beforeEach(() => {
    trip = models.Trip.build({
      orgId: 100,
      experienceId: 3,
      scriptId: 1,
      groupId: 2,
      title: 'Trip',
      date: '2018-01-01',
      departureName: 'Main'
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

  it('requires a group', async () => {
    trip.groupId = null;
    await assertValidation(trip, { groupId: 'must be present' });
  });

  it('requires a date', async () => {
    trip.date = null;
    await assertValidation(trip, { date: 'must be present' });
  });

  it('requires a title', async () => {
    trip.title = '';
    await assertValidation(trip, { title: 'must be present' });
  });

  it('requires a departure', async () => {
    trip.departureName = '';
    await assertValidation(trip, { departureName: 'must be present' });
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

  it('allows gallery name', async () => {
    trip.galleryName = 'abc';
    await trip.validate();
  });

  it('prevents changing associations', async () => {
    const testTrip = await TestUtil.createDummyTrip();
    testTrip.experienceId = 2;
    testTrip.scriptId = 3;
    testTrip.groupId = 4;
    await assertValidation(testTrip, {
      experienceId: 'experienceId is readonly',
      scriptId: 'scriptId is readonly',
      groupId: 'groupId is readonly'
    });
  });
});
