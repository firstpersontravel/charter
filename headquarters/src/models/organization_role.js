const database = require('../config').database;

const Organization = require('./organization');
const User = require('./user');

const {
  belongsToField,
  booleanField,
  snakeCaseColumns
} = require('../sequelize/fields');

/**
 * Organization model.
 */
const OrganizationRole = database.define('OrganizationRole', snakeCaseColumns({
  isAdmin: booleanField(false)
}));

OrganizationRole.belongsTo(Organization, belongsToField('organization'));
OrganizationRole.belongsTo(User, belongsToField('user'));

module.exports = OrganizationRole;
