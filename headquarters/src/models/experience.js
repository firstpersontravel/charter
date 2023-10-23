const database = require('../config').database;
const Org = require('./org');

const {
  allowNullModifier,
  belongsToField,
  booleanField,
  datetimeField,
  integerField,
  requiredStringField,
  mutableModifier,
  optionalStringField,
  snakeCaseColumns
} = require('../sequelize/fields');

/**
 * Experience model.
 */
const Experience = database.define('Experience', snakeCaseColumns({
  createdAt: datetimeField(),
  name: mutableModifier(requiredStringField(255)),
  title: mutableModifier(requiredStringField(255)),
  domain: mutableModifier(optionalStringField(64)),
  timezone: mutableModifier(requiredStringField(32)),
  countryCode: mutableModifier(integerField()),
  areaCode: mutableModifier(allowNullModifier(integerField())),
  isArchived: mutableModifier(booleanField(false))
}));

Experience.belongsTo(Org, belongsToField('org'));

module.exports = Experience;
