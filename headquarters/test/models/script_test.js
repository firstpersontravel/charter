const moment = require('moment');

const models = require('../../src/models');
const { assertValidation } = require('./utils');

describe('Script', () => {
  let script;

  beforeEach(() => {
    script = models.Script.build({
      createdAt: moment.utc(),
      updatedAt: moment.utc(),
      orgId: 100,
      experienceId: 1,
      revision: 1,
      contentVersion: 1,
      content: { meta: { version: 1 } }
    });
  });

  it('validates with all fields present', async () => {
    await script.validate();
  });

  it('requires an org', async () => {
    script.orgId = null;
    await assertValidation(script, { orgId: 'must be present' });
  });

  it('requires experience', async () => {
    script.experienceId = null;
    await assertValidation(script, {
      experienceId: 'must be present'
    });
  });

  it('requires meta', async () => {
    script.content = {};
    await assertValidation(script, {
      content: 'Invalid meta resource.'
    });
  });

  it('errors on invalid collection', async () => {
    script.content = { meta: { version: 1 }, invalid: [{ name: 'hi' }] };
    await assertValidation(script, {
      content: 'There was 1 error validating the following collections: invalid.'
    });
  });

  it('errors on invalid resource', async () => {
    script.content = { meta: { version: 1 }, scenes: [{ bad_value: 'hi' }] };
    await assertValidation(script, {
      content: 'There were 3 errors validating the following collections: scenes.'
    });
  });
});
