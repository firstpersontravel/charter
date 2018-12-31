const database = require('../config').database;

const {
  booleanField,
  requiredStringField,
  optionalStringField,
  snakeCaseColumns
} = require('../sequelize/fields');

/**
 * Experience model.
 */
const Experience = database.define('Experience', snakeCaseColumns({
  name: requiredStringField(255),
  title: requiredStringField(255),
  host: optionalStringField(64),
  timezone: requiredStringField(32),
  isArchived: booleanField(false)
}));

module.exports = Experience;
