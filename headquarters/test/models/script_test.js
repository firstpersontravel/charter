const sinon = require('sinon');

const models = require('../../src/models');
const { assertValidation } = require('./utils');

const sandbox = sinon.sandbox.create();

describe('Script', () => {

  let script;

  beforeEach(() => {
    script = models.Script.build({
      experienceId: 1,
      revision: 1,
      contentVersion: 1,
      content: {}
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('validates with all fields present', async () => {
    await script.validate();
  });

  it('requires experience', async () => {
    script.experienceId = null;
    await assertValidation(script, {
      experienceId: 'must be present'
    });
  });

  it('errors on invalid collection', async () => {
    script.content = { invalid: [{ name: 'hi' }] };
    await assertValidation(script, {
      content: 'There was 1 error validating the following collections: invalid.'
    });
  });

  it('errors on invalid resource', async () => {
    script.content = { scenes: [{ bad_value: 'hi' }] };
    await assertValidation(script, {
      content: 'There were 3 errors validating the following collections: scenes.'
    });
  });
});
