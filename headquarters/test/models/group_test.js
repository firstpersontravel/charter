const sinon = require('sinon');

const models = require('../../src/models');
const { assertValidation } = require('./utils');

const sandbox = sinon.sandbox.create();

describe('Group', () => {

  let group;

  beforeEach(() => {
    group = models.Group.build({
      date: '2018-03-03',
      scriptId: 1
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('validates with all fields present', async () => {
    await group.validate();
  });

  it('requires a script', async () => {
    group.scriptId = null;
    await assertValidation(group, { scriptId: 'must be present' });
  });

  it('requires a date', async () => {
    group.date = null;
    await assertValidation(group, { date: 'must be present' });
  });

  it('requires a boolean isArchived', async () => {
    group.isArchived = 2;
    await assertValidation(group, { isArchived: 'must be true or false' });
  });

  it('requires a valid date', async () => {
    group.date = '30-04-10';
    await assertValidation(group, {
      date: 'must be a date in YYYY-MM-DD format'
    });
  });
});
