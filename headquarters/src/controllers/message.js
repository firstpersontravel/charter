const _ = require('lodash');
const apn = require('apn');
const Raven = require('raven');

const config = require('../config');
const models = require('../models');

var logger = config.logger.child({ name: 'controllers.message' });

/**
 * Send notifications needed for a given message.
 */
async function sendMessage(message) {
  await notifyMessage(message);
  await markReplied(message);
}

/**
 * Send push notifications for a message.
 */
async function notifyMessage(message) {
  if (!_.includes(['text', 'image'], message.messageType)) {
    return;
  }
  const sentBy = await message.getSentBy();
  const sentTo = await message.getSentTo();
  const sentToUser = await sentTo.getUser();
  if (!sentToUser || !sentToUser.devicePushToken) {
    return;
  }
  const pushBody = message.messageType === 'text' ?
    message.messageContent : 'New photo';
  const pushMsg = `${sentBy.roleName}: ${pushBody}`;
  await sendPushNotification(pushMsg, sentToUser.devicePushToken);
}

/**
 * Raw function for sending a push notification.
 */
async function sendPushNotification(msg, deviceToken) {
  const apnProvider = config.getApnProvider();
  if (!apnProvider) {
    return;
  }
  const notification = new apn.Notification({
    alert: msg,
    sound: 'default',
    topic: 'firstpersontravel.Travel'
  });
  try {
    // response.sent: Array of device tokens to which the notification
    // was sent succesfully
    // response.failed: Array of objects containing the device token
    // (`device`) and either an `error`, or a `status` and `response`
    // from the API
    const resp = await apnProvider.send(notification, [deviceToken]);
    if (resp.failed.length > 0) {
      for (let failedSend of resp.failed) {
        logger.error(failedSend.response, 'Failed to send push notification.');
      }
    }
  } catch (err) {
    logger.error(err.message);
    Raven.captureException(err);
  }
}

/**
 * Mark messages where that we've successfully replied to.
 */
async function markReplied(message) {
  // TODO - an optimization can be made here to only call this update query
  // if `message` is from an actor to a non-actor.
  const updates = { replyReceivedAt: message.createdAt };
  return await models.Message.update(updates, {
    where: {
      tripId: message.tripId,
      sentById: message.sentToId,
      sentToId: message.sentById,
      isReplyNeeded: true,
      replyReceivedAt: null
    }
  });
}

const MessageController = {
  sendMessage: sendMessage
};

module.exports = MessageController;
