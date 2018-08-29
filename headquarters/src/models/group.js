const database = require('../config').database;
const Script = require('./script');

const {
  dateField,
  booleanField,
  oneToMany,
  snakeCaseColumns
} = require('./fields');

/**
 * Group model.
 */
const Group = database.define('Group', snakeCaseColumns({
  date: dateField('date'),
  isArchived: booleanField(false)
}));

oneToMany(Group, Script);

module.exports = Group;
