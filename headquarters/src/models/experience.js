const database = require('../config').database;
const Org = require('./org');

const {
  belongsToField,
  booleanField,
  requiredStringField,
  mutableModifier,
  optionalStringField,
  snakeCaseColumns
} = require('../sequelize/fields');

/**
 * Experience model.
 */
const Experience = database.define('Experience', snakeCaseColumns({
  name: mutableModifier(requiredStringField(255)),
  title: mutableModifier(requiredStringField(255)),
  host: mutableModifier(optionalStringField(64)),
  timezone: mutableModifier(requiredStringField(32)),
  isArchived: mutableModifier(booleanField(false))
}));

Experience.belongsTo(Org, belongsToField('org'));

module.exports = Experience;
