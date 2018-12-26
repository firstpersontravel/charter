const sinon = require('sinon');
const moment = require('moment');

const models = require('../../src/models');
const { assertValidation } = require('./utils');

const sandbox = sinon.sandbox.create();

describe('Participant', () => {

  let participant;

  beforeEach(() => {
    participant = models.Participant.build({
      tripId: 2,
      roleName: 'Role'
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('validates with all fields present', async () => {
    await participant.validate();
  });

  it('requires a trip', async () => {
    participant.tripId = null;
    await assertValidation(participant, { tripId: 'must be present' });
  });

  it('requires a role', async () => {
    participant.roleName = '';
    await assertValidation(participant, { roleName: 'must be present' });
  });

  it('allows current page', async () => {
    participant.currentPageName = 'PAGE-1';
    await participant.validate();
  });

  it('allows acknowledged page', async () => {
    participant.acknowledgedPageName = 'PAGE-1';
    participant.acknowledgedPageAt = moment.utc();
    await participant.validate();
  });

  it('allows values', async () => {
    participant.values = { value: 2, another: 'abc' };
    await participant.validate();
  });

  it('requires values to be an object', async () => {
    participant.values = 'abc';
    await assertValidation(participant, { values: 'must be an object' });
    participant.values = [1, 2, 3];
    await assertValidation(participant, { values: 'must be an object' });
  });
});
