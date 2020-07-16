const models = require('../../src/models');
const { assertValidation } = require('./utils');

describe('User', () => {
  let user;

  beforeEach(() => {
    user = models.User.build({
      email: 'test@test.com',
      passwordHash: '123',
    });
  });

  it('validates with all required fields present', async () => {
    await user.validate();
  });

  it('requires an email', async () => {
    user.email = null;
    await assertValidation(user, { email: 'must be present' });
  });

  it('requires a password', async () => {
    user.passwordHash = null;
    await assertValidation(user, { passwordHash: 'must be present' });
  });

  it('allows names', async () => {
    user.firstName = 'Gabe';
    user.lastName = 'Gabe';
    await user.validate();
  });

  it('requires a boolean isArchived', async () => {
    user.isArchived = 2;
    await assertValidation(user, { isArchived: 'must be true or false' });
  });
});
