const _ = require('lodash');

const authz = require('../authorization/authz');
const models = require('../models');
const KernelController = require('../kernel/kernel');
const NotifyController = require('../controllers/notify');
const DeviceStateHandler = require('../handlers/device_state');

/**
 * Create a new action. Also send out a notification to all clients listening
 * of the new action.
 */
const createActionRoute = async (req, res) => {
  const tripId = Number(req.params.tripId);
  const playerId = req.body.player_id;
  const clientId = req.body.client_id;
  if (!req.body.name) {
    res.status(400);
    res.json({ error: 'Name required.' });
    return;
  }
  const trip = await models.Trip.findByPk(tripId);
  authz.checkRecord(req, 'action', models.Trip, trip);
  const action = { name: req.body.name, params: req.body.params || {} };
  await KernelController.applyAction(tripId, action, playerId);
  await NotifyController.notifyAction(tripId, action, clientId);
  res.status(200);
  res.json({ data: { ok: true } });
};

/**
 * Create a new event and trigger any actions caused by it. Also send out
 * a notification to all clients listening of the new event.
 */
const createEventRoute = async (req, res) => {
  const tripId = Number(req.params.tripId);
  const playerId = req.body.player_id;
  const clientId = req.body.client_id;
  const event = _.omit(req.body, ['client_id', 'player_id']);
  const trip = await models.Trip.findByPk(tripId);
  authz.checkRecord(req, 'event', models.Trip, trip);
  await KernelController.applyEvent(tripId, event, playerId);
  await NotifyController.notifyEvent(tripId, event, clientId);
  res.status(200);
  res.json({ data: { ok: true } });
};

/**
 * Update the device state.
 */
const updateDeviceStateRoute = async (req, res) => {
  const participantId = req.params.participantId;
  const tripId = req.params.tripId;
  const clientId = req.body.client_id;
  // Include trip id just for auth checking
  const trip = await models.Trip.findByPk(tripId);
  authz.checkRecord(req, 'deviceState', models.Trip, trip);
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
