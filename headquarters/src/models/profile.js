const database = require('../config').database;
const Experience = require('./experience');
const User = require('./user');

const {
  belongsToField,
  booleanField,
  jsonField,
  mutableModifier,
  optionalStringField,
  requiredStringField,
  snakeCaseColumns
} = require('../sequelize/fields');

/**
 * Profile model
 */
const Profile = database.define('Profile', snakeCaseColumns({
  roleName: mutableModifier(requiredStringField(32)),
  departureName: mutableModifier(optionalStringField(32)),
  isActive: mutableModifier(booleanField(true)),
  photo: mutableModifier(optionalStringField(255)),
  phoneNumber: mutableModifier(optionalStringField(10)),
  skypeUsername: mutableModifier(optionalStringField(64)),
  facetimeUsername: mutableModifier(optionalStringField(64)),
  values: mutableModifier(jsonField(database, 'Profile', 'values')),
  isArchived: mutableModifier(booleanField(false))
}));

Profile.belongsTo(User, belongsToField('user'));
Profile.belongsTo(Experience, mutableModifier(belongsToField('experience')));

module.exports = Profile;
