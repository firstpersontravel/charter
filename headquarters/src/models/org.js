const database = require('../config').database;

const {
  booleanField,
  requiredStringField,
  snakeCaseColumns
} = require('../sequelize/fields');

/**
 * Org model.
 */
const Org = database.define('Org', snakeCaseColumns({
  name: requiredStringField(32, false),
  title: requiredStringField(32, false),
  isPersonal: booleanField(false)
}));

module.exports = Org;
