const { NOW } = require('sequelize');

const database = require('../config').database;
const Group = require('./group');
const Script = require('./script');

const {
  dateField,
  datetimeField,
  booleanField,
  requiredStringField,
  optionalStringField,
  jsonField,
  oneToMany,
  snakeCaseColumns
} = require('./fields');

/**
 * Trip model.
 */
const Trip = database.define('Trip', snakeCaseColumns({
  createdAt: Object.assign(datetimeField(), { defaultValue: NOW }),
  title: requiredStringField(255),
  date: dateField('date'),
  departureName: requiredStringField(10),
  variantNames: optionalStringField(255),
  currentSceneName: optionalStringField(64),
  customizations: jsonField(database, 'Trip', 'customizations'),
  values: jsonField(database, 'Trip', 'values'),
  waypointOptions: jsonField(database, 'Trip', 'waypointOptions'),
  schedule: jsonField(database, 'Trip', 'schedule'),
  history: jsonField(database, 'Trip', 'history'),
  galleryName: optionalStringField(64),
  lastScheduledTime: datetimeField(),
  isArchived: booleanField(false)
}));

oneToMany(Trip, Script);
oneToMany(Trip, Group);

module.exports = Trip;
