const sinon = require('sinon');
const moment = require('moment');

const models = require('../../src/models');
const { assertValidation } = require('./utils');

const sandbox = sinon.sandbox.create();

describe('Trip', () => {

  let trip;

  beforeEach(() => {
    trip = models.Trip.build({
      scriptId: 1,
      groupId: 2,
      createdAt: moment.utc('2018-01-01T02:03:04Z'),
      title: 'Trip',
      date: '2018-01-01',
      departureName: 'Main'
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('validates with all fields present', async () => {
    await trip.validate();
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
});