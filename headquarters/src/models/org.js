const database = require('../config.ts').database;

const {
  booleanField,
  datetimeField,
  requiredStringField,
  snakeCaseColumns
} = require('../sequelize/fields');

/**
 * Org model.
 */
const Org = database.define('Org', snakeCaseColumns({
  createdAt: datetimeField(),
  name: requiredStringField(64),
  title: requiredStringField(64),
  isPersonal: booleanField(false),
  isPaid: booleanField(false),
}));

module.exports = Org;
