const database = require('../config').database;

const Experience = require('./experience');
const Org = require('./org');
const Trip = require('./trip');

const {
  allowNullModifier,
  belongsToField,
  booleanField,
  enumStringField,
  mutableModifier,
  optionalStringField,
  requiredStringField,
  snakeCaseColumns
} = require('../sequelize/fields');

const RELAY_STAGE_OPTIONS = ['test', 'development', 'staging', 'production'];

/**
 * Relay model.
 */
const Relay = database.define('Relay', snakeCaseColumns({
  stage: enumStringField(32, RELAY_STAGE_OPTIONS),
  forRoleName: requiredStringField(32),
  asRoleName: requiredStringField(32),
  withRoleName: requiredStringField(32),
  relayPhoneNumber: requiredStringField(10),
  participantPhoneNumber: optionalStringField(10),  // blank if for everyone
  isActive: mutableModifier(booleanField(true))
}));

Relay.belongsTo(Org, belongsToField('org'));
Relay.belongsTo(Experience, belongsToField('experience'));
Relay.belongsTo(Trip, allowNullModifier(belongsToField('trip')));

module.exports = Relay;
