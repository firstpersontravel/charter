const database = require('../config').database;

const Experience = require('./experience');

const {
  booleanField,
  enumStringField,
  requiredStringField,
  oneToMany,
  optionalStringField,
  snakeCaseColumns
} = require('./fields');

const RELAY_STAGE_OPTIONS = ['test', 'development', 'staging', 'production'];

/**
 * Relay model.
 */
const Relay = database.define('Relay', snakeCaseColumns({
  stage: enumStringField(32, RELAY_STAGE_OPTIONS),
  departureName: requiredStringField(10),
  forRoleName: requiredStringField(32),
  asRoleName: requiredStringField(32),
  withRoleName: requiredStringField(32),
  relayPhoneNumber: requiredStringField(10),
  userPhoneNumber: optionalStringField(10),  // blank if for everyone
  isActive: booleanField(true)
}));

oneToMany(Relay, Experience);

module.exports = Relay;
