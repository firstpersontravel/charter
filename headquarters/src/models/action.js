const database = require('../config').database;
const Trip = require('./trip');

const {
  booleanField,
  datetimeField,
  enumStringField,
  requiredStringField,
  optionalStringField,
  oneToMany,
  jsonField,
  snakeCaseColumns
} = require('../sequelize/fields');

const ACTION_TYPES = ['event', 'action', 'trigger'];

/**
 * Action model.
 */
const Action = database.define('Action', snakeCaseColumns({
  type: enumStringField(10, ACTION_TYPES),
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

oneToMany(Action, Trip);

module.exports = Action;
