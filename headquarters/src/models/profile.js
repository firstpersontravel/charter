const database = require('../config').database;
const Experience = require('./experience');
const User = require('./user');

const {
  booleanField,
  requiredStringField,
  optionalStringField,
  oneToMany,
  jsonField,
  snakeCaseColumns
} = require('./fields');

/**
 * Profile model
 */
const Profile = database.define('Profile', snakeCaseColumns({
  roleName: requiredStringField(32),
  departureName: optionalStringField(32),
  isActive: booleanField(true),
  photo: optionalStringField(255),
  phoneNumber: optionalStringField(10),
  skypeUsername: optionalStringField(64),
  facetimeUsername: optionalStringField(64),
  values: jsonField(database, 'Profile', 'values'),
  isArchived: booleanField(false)
}));

oneToMany(Profile, User);
oneToMany(Profile, Experience);

module.exports = Profile;
