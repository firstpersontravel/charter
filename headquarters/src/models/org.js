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
  name: requiredStringField(32),
  title: requiredStringField(32),
  isPersonal: booleanField(false)
}));

module.exports = Org;
