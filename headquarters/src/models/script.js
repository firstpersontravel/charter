const { NOW, INTEGER } = require('sequelize');

const database = require('../config').database;

const {
  datetimeField,
  booleanField,
  requiredStringField,
  optionalStringField,
  jsonField,
  snakeCaseColumns
} = require('./fields');

/**
 * Script model.
 */
const Script = database.define('Script', snakeCaseColumns({
  createdAt: Object.assign(datetimeField(), { defaultValue: NOW }),
  name: requiredStringField(255),
  title: requiredStringField(255),
  host: optionalStringField(64),
  timezone: requiredStringField(32),
  version: INTEGER,
  content: jsonField(database, 'Script', 'content'),
  isActive: booleanField(false),
  isArchived: booleanField(false)
}));

module.exports = Script;
