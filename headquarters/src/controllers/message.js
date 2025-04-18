const _ = require('lodash');
const apn = require('apn');
const Sentry = require('@sentry/node');

const config = require('../config.ts');
const models = require('../models');

const logger = config.logger.child({ name: 'controllers.message' });

class MessageController {
  /**
   * Send notifications needed for a given message.
   */
  static async sendMessage(message) {
    await this._notifyMessage(message);
    await this._markReplied(message);
  }

  /**
   * Send push notifications for a message.
   */
  static async _notifyMessage(message) {
    if (!_.includes(['text', 'image'], message.medium)) {
      return;
    }
    const fromRoleName = message.fromRoleName;
    const trip = await message.getTrip();
    const script = await trip.getScript();
    const fromRole = script.content.roles.find(r => r.name === fromRoleName);
    const toPlayer = await models.Player.findOne({
      where: { roleName: message.toRoleName, tripId: message.tripId },
      include: [{
        model: models.Participant,
        as: 'participant'
      }]
    });
    if (!toPlayer || !toPlayer.participant || !toPlayer.participant.devicePushToken) {
      return;
    }
    const pushBody = message.medium === 'text' ?
      message.content : 'New photo';
    const pushMsg = `${fromRole.title}: ${pushBody}`;
    await this._sendPushNotification(pushMsg, toPlayer.participant.devicePushToken);
  }

  /**
   * Raw function for sending a push notification.
   */
  static async _sendPushNotification(msg, deviceToken) {
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
      Sentry.captureException(err);
    }
  }

  /**
   * Mark messages where that we've successfully replied to.
   */
  static async _markReplied(message) {
    // TODO - an optimization can be made here to only call this update query
    // if `message` is from an actor to a non-actor.
    const updates = { replyReceivedAt: message.createdAt };
    return await models.Message.update(updates, {
      where: {
        tripId: message.tripId,
        fromRoleName: message.toRoleName,
        toRoleName: message.fromRoleName,
        isReplyNeeded: true,
        replyReceivedAt: null
      }
    });
  }
}

module.exports = MessageController;
