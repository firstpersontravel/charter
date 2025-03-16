const database = require('../config.ts').database;

const Experience = require('./experience');
const Org = require('./org');
const Trip = require('./trip');

const {
  belongsToField,
  datetimeField,
  enumStringField,
  requiredStringField,
  mutableModifier,
  snakeCaseColumns
} = require('../sequelize/fields');

const RELAY_STAGE_OPTIONS = ['test', 'development', 'staging', 'production'];

/**
 * Relay model.
 */
const Relay = database.define('Relay', snakeCaseColumns({
  stage: enumStringField(32, RELAY_STAGE_OPTIONS),
  forPhoneNumber: requiredStringField(15),
  forRoleName: requiredStringField(32),
  asRoleName: requiredStringField(32),
  withRoleName: requiredStringField(32),
  relayPhoneNumber: requiredStringField(15),
  messagingServiceId: requiredStringField(34),
  lastActiveAt: mutableModifier(datetimeField()),
}));

Relay.belongsTo(Org, belongsToField('org'));
Relay.belongsTo(Experience, belongsToField('experience'));
Relay.belongsTo(Trip, belongsToField('trip'));

module.exports = Relay;
