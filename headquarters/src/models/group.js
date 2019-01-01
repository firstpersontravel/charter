const database = require('../config').database;
const Experience = require('./experience');
const Script = require('./script');

const {
  belongsToField,
  booleanField,
  dateField,
  mutableModifier,
  snakeCaseColumns
} = require('../sequelize/fields');

/**
 * Group model.
 */
const Group = database.define('Group', snakeCaseColumns({
  date: dateField('date'),
  isArchived: mutableModifier(booleanField(false))
}));

Group.belongsTo(Experience, belongsToField('experience'));
Group.belongsTo(Script, belongsToField('script'));

module.exports = Group;
