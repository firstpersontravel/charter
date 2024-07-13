const database = require('../config').database;

const Experience = require('./experience');
const Org = require('./org');
const RelayService = require('./relay_service');

const {
  belongsToField,
  optionalStringField,
  enumStringField,
  mutableModifier,
  requiredStringField,
  snakeCaseColumns
} = require('../sequelize/fields');

const RELAY_STAGE_OPTIONS = ['test', 'development', 'staging', 'production'];

/**
 * Relay model.
 */
const RelayEntryway = database.define('RelayEntryway', snakeCaseColumns({
  stage: enumStringField(32, RELAY_STAGE_OPTIONS),
  welcome: mutableModifier(requiredStringField(255)),
  keyword: mutableModifier(optionalStringField(32)),
}));

RelayEntryway.belongsTo(Org, belongsToField('org'));
RelayEntryway.belongsTo(Experience, belongsToField('experience'));
RelayEntryway.belongsTo(RelayService, belongsToField('relayService'));

module.exports = RelayEntryway;
