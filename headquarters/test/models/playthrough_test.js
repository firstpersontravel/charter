const sinon = require('sinon');
const moment = require('moment');

const models = require('../../src/models');
const { assertValidation } = require('./utils');

const sandbox = sinon.sandbox.create();

describe('Playthrough', () => {

  let playthrough;

  beforeEach(() => {
    playthrough = models.Playthrough.build({
      scriptId: 1,
      groupId: 2,
      createdAt: moment.utc('2018-01-01T02:03:04Z'),
      title: 'Playthrough',
      date: '2018-01-01',
      departureName: 'Main'
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('validates with all fields present', async () => {
    await playthrough.validate();
  });

  it('requires a script', async () => {
    playthrough.scriptId = null;
    await assertValidation(playthrough, { scriptId: 'must be present' });
  });

  it('requires a group', async () => {
    playthrough.groupId = null;
    await assertValidation(playthrough, { groupId: 'must be present' });
  });

  it('requires a date', async () => {
    playthrough.date = null;
    await assertValidation(playthrough, { date: 'must be present' });
  });

  it('requires a title', async () => {
    playthrough.title = '';
    await assertValidation(playthrough, { title: 'must be present' });
  });

  it('requires a departure', async () => {
    playthrough.departureName = '';
    await assertValidation(playthrough, { departureName: 'must be present' });
  });

  it('allows values', async () => {
    playthrough.values = { value: 2, another: 'abc' };
    await playthrough.validate();
  });

  it('requires values to be an object', async () => {
    playthrough.values = 'abc';
    await assertValidation(playthrough, { values: 'must be an object' });
    playthrough.values = [1, 2, 3];
    await assertValidation(playthrough, { values: 'must be an object' });
  });

  it('allows schedule', async () => {
    playthrough.schedule = { value: 2, another: 'abc' };
    await playthrough.validate();
  });

  it('allows history', async () => {
    playthrough.history = { value: 2, another: 'abc' };
    await playthrough.validate();
  });

  it('allows gallery name', async () => {
    playthrough.galleryName = 'abc';
    await playthrough.validate();
  });
});
