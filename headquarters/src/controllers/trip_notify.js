const moment = require('moment');
const Promise = require('bluebird');

const config = require('../config');

var logger = config.logger.child({ name: 'controllers.trip_notify' });

async function notifyFaye(channel, message) {
  if (!config.getFayeClient()) {
    return;
  }
  logger.info(`Sending ${message.type} to faye channel "${channel}".`);
  return await config.getFayeClient()
    .publish(channel, message)
    .then(() => {
    })
    .catch((err) => {
      logger.error(`Failed to send ${message.type} notification to faye.`);
      logger.error(err.message);
    });
}

async function notifyPubnub(channel, message) {
  if (!config.getPubnubClient()) {
    return;
  }
  logger.info(`Sending ${message.type} to pubnub channel "${channel}".`);
  return await new Promise((resolve) => {
    config.getPubnubClient().publish({
      channel: channel,
      message: message
    }, (status) => {
      if (status.error) {
        logger.error(`Failed to send ${message.type} notification to pubnub.`);
        logger.error(status);
        resolve();
      } else {
        resolve();
      }
    });
  });
}

async function notify(tripId, type, content=null) {
  const channel = `${config.env.STAGE}_trip_${tripId}`;
  const message = { type: type, content: content };
  await Promise.all([
    notifyFaye(`/${channel}`, message),
    notifyPubnub(channel, message)
  ]);
}

async function notifyUserDeviceState(tripId, user, clientId=null) {
  return await notify(tripId, 'device_state', {
    client_id: clientId,
    user_id: user.id,
    device_state: {
      location_latitude: user.locationLatitude,
      location_longitude: user.locationLongitude,
      location_accuracy: user.locationAccuracy,
      location_timestamp: user.locationTimestamp
    }
  });
}

async function notifyEvent(tripId, event, clientId=null) {
  return await notify(tripId, 'event', {
    client_id: clientId,
    event: event,
    sent_at: moment.utc().toISOString()
  });
}

async function notifyTrigger(tripId, triggerName, clientId=null) {
  return await notify(tripId, 'trigger', {
    client_id: clientId,
    trigger_name: triggerName,
    sent_at: moment.utc().toISOString()
  });
}

async function notifyAction(tripId, action, clientId=null) {
  return await notify(tripId, 'action', {
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
        playthrough: {
          data: {
            type: 'playthrough',
            id: tripId
          }
        }
      }
    }
  });
}

const TripNotifyController = {
  notify: notify,
  notifyEvent: notifyEvent,
  notifyTrigger: notifyTrigger,
  notifyAction: notifyAction,
  notifyUserDeviceState: notifyUserDeviceState,
};

module.exports = TripNotifyController;
