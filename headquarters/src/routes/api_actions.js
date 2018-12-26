const _ = require('lodash');

const TripActionController = require('../controllers/trip_action');
const TripNotifyController = require('../controllers/trip_notify');
const UserController = require('../controllers/user');

/**
 * Create a new action. Also send out a notification to all clients listening
 * of the new action.
 */
const createActionRoute = async (req, res) => {
  const tripId = req.params.tripId;
  const clientId = req.body.client_id;
  const params = _.omit(req.body, ['client_id']);
  const action = { name: req.params.actionName, params: params };
  await TripActionController.applyAction(tripId, action);
  await TripNotifyController.notifyAction(tripId, action, clientId);
  res.status(200);
  res.json({ data: { ok: true } });
};

/**
 * Create a new event and trigger any actions caused by it. Also send out
 * a notification to all clients listening of the new event.
 */
const createEventRoute = async (req, res) => {
  const tripId = req.params.tripId;
  const clientId = req.body.client_id;
  const event = _.omit(req.body, ['client_id']);
  await TripActionController.applyEvent(tripId, event);
  await TripNotifyController.notifyEvent(tripId, event, clientId);
  res.status(200);
  res.json({ data: { ok: true } });
};

/**
 * Update the device state.
 */
const updateDeviceStateRoute = async (req, res) => {
  const userId = req.params.userId;
  const clientId = req.body.client_id;
  const params = {
    locationLatitude: Number(req.body.location_latitude),
    locationLongitude: Number(req.body.location_longitude),
    locationAccuracy: Number(req.body.location_accuracy),
    locationTimestamp: Number(req.body.location_timestamp),
    deviceIsActive: _.isUndefined(req.body.device_is_active) ?
      null : (req.body.device_is_active === 'true'),
    deviceBattery: _.isUndefined(req.body.device_battery) ?
      null : Number(req.body.device_battery)
  };
  await UserController.updateDeviceState(userId, params, clientId);
  res.status(200);
  res.json({ data: { ok: true } });
};

module.exports = {
  createActionRoute,
  createEventRoute,
  updateDeviceStateRoute
};
