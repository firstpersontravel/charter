const database = require('../config.ts').database;

const Org = require('./org');
const Trip = require('./trip');

const {
  belongsToField,
  datetimeField,
  integerField,
  requiredStringField,
  snakeCaseColumns
} = require('../sequelize/fields');

/**
 * Log entry model.
 */
const LogEntry = database.define('LogEntry', snakeCaseColumns({
  createdAt: datetimeField(),
  level: integerField(),
  message: requiredStringField(255),
}), {
  tableName: 'LogEntries'
});

LogEntry.belongsTo(Org, belongsToField('org'));
LogEntry.belongsTo(Trip, belongsToField('trip'));

module.exports = LogEntry;
