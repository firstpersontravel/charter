const database = require('../config').database;
const Trip = require('./trip');
const Player = require('./player');

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
  snakeCaseColumns,
  textField
} = require('../sequelize/fields');


/**
 * Message model.
 */
const Message = database.define('Message', snakeCaseColumns({
  createdAt: datetimeField(),
  sentFromLatitude: doubleField(),
  sentFromLongitude: doubleField(),
  sentFromAccuracy: floatField(),
  messageName: optionalStringField(64),
  messageType: enumStringField(5, ['text', 'image', 'audio', 'video']),
  messageContent: textField({ notNull: { msg: 'must be present' } }),
  isReplyNeeded: booleanField(false),
  readAt: mutableModifier(allowNullModifier(datetimeField())),
  replyReceivedAt: mutableModifier(allowNullModifier(datetimeField())),
  isInGallery: mutableModifier(booleanField(false)),
  isArchived: mutableModifier(booleanField(false))
}));

Message.belongsTo(Trip, belongsToField('trip'));
Message.belongsTo(Player, belongsToField('sentBy'));
Message.belongsTo(Player, belongsToField('sentTo'));

module.exports = Message;
