const _ = require('lodash');

const KernelController = require('../kernel/kernel');
const NotifyController = require('../controllers/notify');
const DeviceStateHandler = require('../handlers/device_state');

/**
 * Create a new action. Also send out a notification to all clients listening
 * of the new action.
 */
const createActionRoute = async (req, res) => {
  const tripId = req.params.tripId;
  const clientId = req.body.client_id;
  if (!req.body.name) {
    res.status(400);
    res.json({ error: 'Name required.' });
    return;
  }
  const action = { name: req.body.name, params: req.body.params || {} };
  await KernelController.applyAction(tripId, action);
  await NotifyController.notifyAction(tripId, action, clientId);
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
  await KernelController.applyEvent(tripId, event);
  await NotifyController.notifyEvent(tripId, event, clientId);
  res.status(200);
  res.json({ data: { ok: true } });
};

/**
 * Update the device state.
 */
const updateDeviceStateRoute = async (req, res) => {
  const participantId = req.params.participantId;
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
  await DeviceStateHandler.updateDeviceState(participantId, params, clientId);
  res.status(200);
  res.json({ data: { ok: true } });
};

module.exports = {
  createActionRoute,
  createEventRoute,
  updateDeviceStateRoute
};
