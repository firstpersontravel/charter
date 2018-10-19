const database = require('../config').database;
const Playthrough = require('./playthrough');

const {
  booleanField,
  datetimeField,
  enumStringField,
  requiredStringField,
  optionalStringField,
  oneToMany,
  jsonField,
  snakeCaseColumns
} = require('./fields');

/**
 * Action model.
 */
const Action = database.define('Action', snakeCaseColumns({
  type: enumStringField(10, ['event', 'action', 'trigger'], 'must be an event, action, or trigger'),
  name: requiredStringField(64),
  params: jsonField(database, 'Action', 'params'),
  triggerName: optionalStringField(64),
  event: jsonField(database, 'Action', 'event', { allowNull: true }),
  isArchived: booleanField(false),
  createdAt: datetimeField(),
  scheduledAt: datetimeField(),
  appliedAt: datetimeField(),
  failedAt: datetimeField()
}));

oneToMany(Action, Playthrough);

module.exports = Action;
