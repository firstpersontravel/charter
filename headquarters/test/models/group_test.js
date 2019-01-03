const models = require('../../src/models');
const { assertValidation } = require('./utils');

describe('Group', () => {
  let group;

  beforeEach(() => {
    group = models.Group.build({
      orgId: 100,
      experienceId: 1,
      scriptId: 2,
      date: '2018-03-03'
    });
  });

  it('validates with all fields present', async () => {
    await group.validate();
  });

  it('requires an org', async () => {
    group.orgId = null;
    await assertValidation(group, { orgId: 'must be present' });
  });

  it('requires an experience', async () => {
    group.experienceId = null;
    await assertValidation(group, { experienceId: 'must be present' });
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
