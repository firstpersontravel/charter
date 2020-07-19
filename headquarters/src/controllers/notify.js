const moment = require('moment');

const config = require('../config');

const logger = config.logger.child({ name: 'controllers.notify' });

class NotifyController {
  static async _notifyFaye(channel, message) {
    if (!config.getFayeClient()) {
      return;
    }
    logger.info(`Sending ${message.type} to faye channel "${channel}".`);
    return await config.getFayeClient()
      .publish(channel, message)
      .then(() => {
        logger.info(`Completed publish to ${channel}.`);
      })
      .catch((err) => {
        logger.error(`Failed to send ${message.type} notification to faye.`);
        logger.error(err.message);
      });
  }

  static async notify(tripId, type, content=null) {
    const channel = `trip_${tripId}`;
    const message = { type: type, content: content };
    await this._notifyFaye(`/${channel}`, message);
  }

  static async notifyParticipantDeviceState(tripId, participant, clientId=null) {
    return await this.notify(tripId, 'device_state', {
      client_id: clientId,
      participant_id: participant.id,
      device_state: {
        location_latitude: participant.locationLatitude,
        location_longitude: participant.locationLongitude,
        location_accuracy: participant.locationAccuracy,
        location_timestamp: participant.locationTimestamp
      }
    });
  }

  static async notifyEvent(tripId, event, clientId=null) {
    return await this.notify(tripId, 'event', {
      client_id: clientId,
      event: event,
      sent_at: moment.utc().toISOString()
    });
  }

  static async notifyTrigger(tripId, triggerName, clientId=null) {
    return await this.notify(tripId, 'trigger', {
      client_id: clientId,
      trigger_name: triggerName,
      sent_at: moment.utc().toISOString()
    });
  }

  static async notifyAction(tripId, action, clientId=null) {
    return await this.notify(tripId, 'action', {
      client_id: clientId,
      action: {
        id: Math.floor(Math.random() * 10000000),
        type: 'action',
        attributes: {
          name: action.name,
          params: action.params,
          event: action.event,
          'created-at': moment.utc().toISOString(),
          'synced-at': moment.utc().toISOString(),
          'scheduled-at': (action.scheduleAt || moment.utc()).toISOString(),
          'applied-at': null,
          'failed-at': null
        },
        relationships: {
          trip: {
            data: {
              type: 'trip',
              id: tripId
            }
          }
        }
      }
    });
  }
}

module.exports = NotifyController;
