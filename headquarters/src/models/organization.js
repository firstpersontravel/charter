const database = require('../config').database;

const {
  requiredStringField,
  snakeCaseColumns
} = require('../sequelize/fields');

/**
 * Organization model.
 */
const Organization = database.define('Organization', snakeCaseColumns({
  name: requiredStringField(32, false),
  title: requiredStringField(32, false)
}));

module.exports = Organization;
