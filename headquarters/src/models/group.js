const database = require('../config').database;
const Experience = require('./experience');
const Script = require('./script');

const {
  dateField,
  booleanField,
  oneToMany,
  snakeCaseColumns
} = require('../sequelize/fields');

/**
 * Group model.
 */
const Group = database.define('Group', snakeCaseColumns({
  date: dateField('date'),
  isArchived: booleanField(false)
}));

oneToMany(Group, Experience);
oneToMany(Group, Script);

module.exports = Group;
