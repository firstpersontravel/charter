const database = require('../config').database;

const Org = require('./org');
const User = require('./user');

const {
  belongsToField,
  booleanField,
  snakeCaseColumns
} = require('../sequelize/fields');

/**
 * Org model.
 */
const OrgRole = database.define('OrgRole', snakeCaseColumns({
  isAdmin: booleanField(false)
}));

OrgRole.belongsTo(Org, belongsToField('org'));
OrgRole.belongsTo(User, belongsToField('user'));
User.hasMany(OrgRole, { as: 'orgRoles', foreignKey: 'user_id' });

module.exports = OrgRole;
