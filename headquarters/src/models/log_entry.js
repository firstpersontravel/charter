const database = require('../config').database;

const Org = require('./org');
const Trip = require('./trip');

const {
  belongsToField,
  datetimeField,
  integerField,
  requiredStringField,
  jsonField,
  snakeCaseColumns
} = require('../sequelize/fields');

/**
 * Log entry model.
 */
const LogEntry = database.define('LogEntry', snakeCaseColumns({
  createdAt: datetimeField(),
  level: integerField(),
  entryType: requiredStringField(64),
  message: requiredStringField(255),
  params: jsonField(database, 'LogEntry', 'params')
}), {
  tableName: 'LogEntries'
});

LogEntry.belongsTo(Org, belongsToField('org'));
LogEntry.belongsTo(Trip, belongsToField('trip'));

module.exports = LogEntry;
