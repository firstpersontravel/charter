const database = require('../config').database;
const Experience = require('./experience');
const Org = require('./org');
const Participant = require('./participant');

const {
  belongsToField,
  booleanField,
  jsonField,
  mutableModifier,
  requiredStringField,
  snakeCaseColumns
} = require('../sequelize/fields');

/**
 * Profile model
 */
const Profile = database.define('Profile', snakeCaseColumns({
  roleName: mutableModifier(requiredStringField(32)),
  isActive: mutableModifier(booleanField(true)),
  values: mutableModifier(jsonField(database, 'Profile', 'values')),
  isArchived: mutableModifier(booleanField(false))
}));

Profile.belongsTo(Org, belongsToField('org'));
Profile.belongsTo(Experience, belongsToField('experience'));
Profile.belongsTo(Participant, belongsToField('participant'));

module.exports = Profile;
