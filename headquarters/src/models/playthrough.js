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
 * Playthrough model.
 */
const Playthrough = database.define('Playthrough', snakeCaseColumns({
  createdAt: Object.assign(datetimeField(), { defaultValue: NOW }),
  title: requiredStringField(255),
  date: dateField('date'),
  departureName: requiredStringField(10),
  variantNames: optionalStringField(255),
  currentSceneName: optionalStringField(64),
  values: jsonField(database, 'Playthrough', 'values'),
  schedule: jsonField(database, 'Playthrough', 'schedule'),
  history: jsonField(database, 'Playthrough', 'history'),
  galleryName: optionalStringField(64),
  lastScheduledTime: datetimeField(),
  isArchived: booleanField(false)
}));

oneToMany(Playthrough, Script);
oneToMany(Playthrough, Group);

module.exports = Playthrough;
