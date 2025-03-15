const database = require('../config.ts').database;
const Experience = require('./experience');
const Org = require('./org');
const Script = require('./script');

const {
  allowNullModifier,
  belongsToField,
  booleanField,
  dateField,
  datetimeField,
  mutableModifier,
  jsonField,
  optionalStringField,
  requiredStringField,
  snakeCaseColumns
} = require('../sequelize/fields');

/**
 * Trip model.
 */
const Trip = database.define('Trip', snakeCaseColumns({
  createdAt: datetimeField(),
  updatedAt: mutableModifier(datetimeField()),
  title: mutableModifier(requiredStringField(255)),
  date: dateField('date'),
  variantNames: mutableModifier(optionalStringField(255)),
  tripState: mutableModifier(jsonField(database, 'Trip', 'tripState')),
  customizations: mutableModifier(
    jsonField(database, 'Trip', 'customizations')),
  values: mutableModifier(jsonField(database, 'Trip', 'values')),
  waypointOptions: mutableModifier(
    jsonField(database, 'Trip', 'waypointOptions')),
  schedule: mutableModifier(jsonField(database, 'Trip', 'schedule')),
  history: mutableModifier(jsonField(database, 'Trip', 'history')),
  scheduleAt: mutableModifier(allowNullModifier(datetimeField())),
  scheduleUpdatedAt: mutableModifier(allowNullModifier(datetimeField())),
  isArchived: mutableModifier(booleanField(false))
}));

Trip.belongsTo(Org, belongsToField('org'));
Trip.belongsTo(Experience, belongsToField('experience'));
Trip.belongsTo(Script, belongsToField('script'));

module.exports = Trip;
