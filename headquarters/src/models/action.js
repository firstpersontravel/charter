const database = require('../config').database;
const Playthrough = require('./playthrough');

const fptcore = require('fptcore');

const {
  booleanField,
  datetimeField,
  enumStringField,
  optionalStringField,
  oneToMany,
  jsonField,
  snakeCaseColumns
} = require('./fields');

const actionNames = Object.keys(fptcore.Actions);

/**
 * Action model.
 */
const Action = database.define('Action', snakeCaseColumns({
  name: enumStringField(32, actionNames, 'must be a valid action'),
  params: jsonField(database, 'Action', 'params'),
  triggerName: optionalStringField(64),
  event: jsonField(database, 'Action', 'event', { allowNull: true }),
  isArchived: booleanField(false),
  createdAt: datetimeField(),
  syncedAt: datetimeField(),
  scheduledAt: datetimeField(),
  appliedAt: datetimeField(),
  failedAt: datetimeField()
}));

oneToMany(Action, Playthrough);

module.exports = Action;
