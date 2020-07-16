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
 * Participant model.
 */
const Participant = database.define('Participant', snakeCaseColumns({
  name: mutableModifier(optionalStringField(255)),
  email: mutableModifier(optionalStringField(255)),
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

Participant.belongsTo(Org, belongsToField('org'));
Participant.belongsTo(Experience, belongsToField('experience'));

module.exports = Participant;
