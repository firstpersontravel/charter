const _ = require('lodash');
const assert = require('assert');

async function assertValidation(record, expectedFieldErrors) {
  let caughtError = null;
  try {
    await record.validate();
  } catch (err) {
    caughtError = err;
  }
  if (!caughtError) {
    assert.fail(
      `Expected errors on ${_.keys(expectedFieldErrors).join(', ')}.`
    );
  }
  const caughtFieldErrors = _(caughtError.errors)
    .map(err => [err.path, err.message])
    .fromPairs()
    .value();
  assert.deepStrictEqual(caughtFieldErrors, expectedFieldErrors);
}

module.exports = {
  assertValidation
};
