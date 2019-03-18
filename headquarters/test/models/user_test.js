const models = require('../../src/models');
const { assertValidation } = require('./utils');

describe('User', () => {
  let user;

  beforeEach(() => {
    user = models.User.build({
      orgId: 100,
      experienceId: 1,
    });
  });

  it('validates with all required fields present', async () => {
    await user.validate();
  });

  it('requires an org', async () => {
    user.orgId = null;
    await assertValidation(user, { orgId: 'must be present' });
  });

  it('does not require an experience', async () => {
    user.experienceId = null;
    await user.validate();
  });

  it('allows names', async () => {
    user.firstName = 'Gabe';
    user.lastName = 'Smedresman';
    await user.validate();
  });

  it('requires a boolean isArchived', async () => {
    user.isArchived = 2;
    await assertValidation(user, { isArchived: 'must be true or false' });
  });

  it('requires a boolean isActive', async () => {
    user.isActive = 2;
    await assertValidation(user, { isActive: 'must be true or false' });
  });
});
