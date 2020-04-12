const database = require('../config').database;
const Trip = require('./trip');
const Org = require('./org');

const {
  allowNullModifier,
  belongsToField,
  booleanField,
  datetimeField,
  doubleField,
  enumStringField,
  floatField,
  mutableModifier,
  optionalStringField,
  requiredStringField,
  snakeCaseColumns,
  textField
} = require('../sequelize/fields');

const MESSAGE_MEDIUM_OPTIONS = ['text', 'image', 'audio', 'video'];

/**
 * Message model.
 */
const Message = database.define('Message', snakeCaseColumns({
  createdAt: datetimeField(),
  fromRoleName: requiredStringField(32),
  toRoleName: requiredStringField(32),
  sentFromLatitude: allowNullModifier(doubleField()),
  sentFromLongitude: allowNullModifier(doubleField()),
  sentFromAccuracy: allowNullModifier(floatField()),
  name: optionalStringField(64),
  medium: enumStringField(5, MESSAGE_MEDIUM_OPTIONS),
  content: textField(),
  isReplyNeeded: booleanField(false),
  readAt: mutableModifier(allowNullModifier(datetimeField())),
  replyReceivedAt: mutableModifier(allowNullModifier(datetimeField())),
  isInGallery: mutableModifier(booleanField(false)),
  isArchived: mutableModifier(booleanField(false))
}));

Message.belongsTo(Org, belongsToField('org'));
Message.belongsTo(Trip, belongsToField('trip'));

module.exports = Message;
