const database = require('../config').database;

const {
  datetimeField,
  booleanField,
  requiredStringField,
  optionalStringField,
  doubleField,
  floatField,
  snakeCaseColumns
} = require('../sequelize/fields');

/**
 * User model.
 */
const User = database.define('User', snakeCaseColumns({
  email: optionalStringField(255),
  firstName: requiredStringField(255),
  lastName: optionalStringField(255),
  phoneNumber: optionalStringField(10),
  isActive: booleanField(true),
  deviceId: optionalStringField(255),
  devicePushToken: optionalStringField(255),
  locationLatitude: doubleField(),
  locationLongitude: doubleField(),
  locationAccuracy: floatField(),
  locationTimestamp: datetimeField(),
  deviceBattery: floatField(),
  deviceLastActive: datetimeField(),
  deviceTimestamp: datetimeField(),
  isArchived: booleanField(false)
}));

module.exports = User;
