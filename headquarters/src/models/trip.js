const database = require('../config').database;
const Experience = require('./experience');
const Group = require('./group');
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
  title: mutableModifier(requiredStringField(255)),
  date: dateField('date'),
  departureName: mutableModifier(optionalStringField(32)),
  variantNames: mutableModifier(optionalStringField(255)),
  currentSceneName: mutableModifier(optionalStringField(64)),
  customizations: mutableModifier(
    jsonField(database, 'Trip', 'customizations')),
  values: mutableModifier(jsonField(database, 'Trip', 'values')),
  waypointOptions: mutableModifier(
    jsonField(database, 'Trip', 'waypointOptions')),
  schedule: mutableModifier(jsonField(database, 'Trip', 'schedule')),
  history: mutableModifier(jsonField(database, 'Trip', 'history')),
  galleryName: mutableModifier(optionalStringField(64)),
  lastScheduledTime: mutableModifier(allowNullModifier(datetimeField())),
  isArchived: mutableModifier(booleanField(false))
}));

Trip.belongsTo(Org, belongsToField('org'));
Trip.belongsTo(Experience, belongsToField('experience'));
Trip.belongsTo(Script, belongsToField('script'));
Trip.belongsTo(Group, belongsToField('group'));

module.exports = Trip;
