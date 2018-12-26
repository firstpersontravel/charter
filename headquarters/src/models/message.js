const database = require('../config').database;
const Trip = require('./trip');
const Player = require('./player');

const {
  datetimeField,
  booleanField,
  doubleField,
  floatField,
  optionalStringField,
  enumStringField,
  textField,
  oneToMany,
  belongsTo,
  snakeCaseColumns
} = require('./fields');


/**
 * Message model.
 */
const Message = database.define('Message', snakeCaseColumns({
  createdAt: datetimeField(false),
  sentFromLatitude: doubleField(),
  sentFromLongitude: doubleField(),
  sentFromAccuracy: floatField(),
  messageName: optionalStringField(64),
  messageType: enumStringField(5, ['text', 'image', 'audio', 'video']),
  messageContent: textField({ notNull: { msg: 'must be present' } }),
  readAt: datetimeField(),
  isReplyNeeded: booleanField(false),
  replyReceivedAt: datetimeField(),
  isInGallery: booleanField(false),
  isArchived: booleanField(false)
}));

oneToMany(Message, Trip);
Message.belongsTo(Player, belongsTo('sentBy'));
Message.belongsTo(Player, belongsTo('sentTo'));

module.exports = Message;
