const database = require('../config').database;

const {
  booleanField,
  enumStringField,
  requiredStringField,
  optionalStringField,
  snakeCaseColumns
} = require('./fields');

/**
 * Relay model.
 */
const Relay = database.define('Relay', snakeCaseColumns({
  stage: enumStringField(32, ['test', 'development', 'staging', 'production']),
  scriptName: requiredStringField(32),
  departureName: requiredStringField(10),
  forRoleName: requiredStringField(32),
  asRoleName: requiredStringField(32),
  withRoleName: optionalStringField(32), // can be blank if admin
  phoneNumber: requiredStringField(10),
  isActive: booleanField(true)
}));

module.exports = Relay;
