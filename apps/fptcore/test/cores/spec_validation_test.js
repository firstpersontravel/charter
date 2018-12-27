// const assert = require('assert');
const sinon = require('sinon');

// const SpecValidationCore = require('../../src/cores/spec_validation');
// const ParamValidators = require('../../src/utils/param_validators');

const sandbox = sinon.sandbox.create();

describe('SpecValidationCore', () => {
  afterEach(() => {
    sandbox.restore();
  });

  describe('#getWarnings', () => {
    it.skip('gets warnings', () => {});
  });
});
