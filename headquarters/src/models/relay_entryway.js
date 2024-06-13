const database = require('../config').database;

const Experience = require('./experience');
const Org = require('./org');
const RelayService = require('./relay_service');

const {
  belongsToField,
  optionalStringField,
  requiredStringField,
  snakeCaseColumns
} = require('../sequelize/fields');

/**
 * Relay model.
 */
const RelayEntryway = database.define('RelayEntryway', snakeCaseColumns({
  welcome: requiredStringField(255),
  keyword: optionalStringField(32),
}));

RelayEntryway.belongsTo(Org, belongsToField('org'));
RelayEntryway.belongsTo(Experience, belongsToField('experience'));
RelayEntryway.belongsTo(RelayService, belongsToField('relayService'));

module.exports = RelayEntryway;
