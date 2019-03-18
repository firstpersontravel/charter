const database = require('../config').database;
const Org = require('./org');
const Experience = require('./experience');

const {
  allowNullModifier,
  belongsToField,
  booleanField,
  datetimeField,
  doubleField,
  floatField,
  mutableModifier,
  optionalStringField,
  snakeCaseColumns
} = require('../sequelize/fields');

/**
 * User model.
 */
const User = database.define('User', snakeCaseColumns({
  email: mutableModifier(optionalStringField(255)),
  passwordHash: mutableModifier(optionalStringField(60)),
  firstName: mutableModifier(optionalStringField(255)),
  lastName: mutableModifier(optionalStringField(255)),
  phoneNumber: mutableModifier(optionalStringField(10)),
  isActive: mutableModifier(booleanField(true)),
  deviceId: mutableModifier(optionalStringField(255)),
  devicePushToken: mutableModifier(optionalStringField(255)),
  locationLatitude: mutableModifier(doubleField()),
  locationLongitude: mutableModifier(doubleField()),
  locationAccuracy: mutableModifier(floatField()),
  locationTimestamp: mutableModifier(allowNullModifier(datetimeField())),
  deviceBattery: mutableModifier(floatField()),
  deviceLastActive: mutableModifier(allowNullModifier(datetimeField())),
  deviceTimestamp: mutableModifier(allowNullModifier(datetimeField())),
  isArchived: mutableModifier(booleanField(false))
}));

User.belongsTo(Org, belongsToField('org'));

// Null experience users are admins -- others are players.
User.belongsTo(Experience, allowNullModifier(belongsToField('experience')));

module.exports = User;
