const database = require('../config.ts').database;
const Org = require('./org');
const Player = require('./player');
const Trip = require('./trip');

const {
  allowNullModifier,
  belongsToField,
  booleanField,
  datetimeField,
  enumStringField,
  mutableModifier,
  requiredStringField,
  optionalStringField,
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
  event: allowNullModifier(jsonField(database, 'Action', 'event')),
  createdAt: datetimeField(),
  scheduledAt: mutableModifier(datetimeField()),
  appliedAt: mutableModifier(allowNullModifier(datetimeField())),
  failedAt: mutableModifier(allowNullModifier(datetimeField())),
  isArchived: mutableModifier(booleanField(false))
}));

Action.belongsTo(Org, belongsToField('org'));
Action.belongsTo(Trip, belongsToField('trip'));
Action.belongsTo(Player, allowNullModifier(belongsToField('triggeringPlayer')));

module.exports = Action;
