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
  withRoleName: requiredStringField(32),
  relayPhoneNumber: requiredStringField(10),
  userPhoneNumber: optionalStringField(10),  // blank if for everyone
  isActive: booleanField(true)
}));

module.exports = Relay;
