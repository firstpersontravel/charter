const _ = require('lodash');

const authz = require('../authorization/authz');
const models = require('../models');
const KernelController = require('../kernel/kernel');
const NotifyController = require('../controllers/notify');
const DeviceStateHandler = require('../handlers/device_state');

async function applyAction(req, trips, action, playerId, clientId) {
  for (const trip of trips) {
    await KernelController.applyAction(trip.id, action, playerId);
    await NotifyController.notifyAction(trip.id, action, clientId);
  }
}

async function createTripActionRoute(req, res) {
  const tripId = Number(req.params.tripId);
  const playerId = req.body.player_id;
  const clientId = req.body.client_id;
  if (!req.body.name) {
    res.status(400);
    res.json({ error: 'Name required.' });
    return;
  }
  const trip = await models.Trip.findByPk(tripId);
  const action = { name: req.body.name, params: req.body.params || {} };
  authz.checkRecord(req, 'action', models.Trip, trip);
  await applyAction(req, [trip], action, playerId, clientId);
  res.status(200);
  res.json({ data: { ok: true } });
}

async function createGroupActionRoute(req, res) {
  const groupId = Number(req.params.groupId);
  const playerId = req.body.player_id;
  const clientId = req.body.client_id;
  if (!req.body.name) {
    res.status(400);
    res.json({ error: 'Name required.' });
    return;
  }
  const group = await models.Group.findByPk(groupId);
  authz.checkRecord(req, 'action', models.Group, group);

  const trips = await models.Trip.findAll({
    where: { groupId: groupId, isArchived: false }
  });
  const action = { name: req.body.name, params: req.body.params || {} };
  await applyAction(req, trips, action, playerId, clientId);
  res.status(200);
  res.json({ data: { ok: true } });
}

async function applyEvent(req, trips, event, playerId, clientId) {
  for (const trip of trips) {
    await KernelController.applyEvent(trip.id, event, playerId);
    await NotifyController.notifyEvent(trip.id, event, clientId);
  }
}

async function createTripEventRoute(req, res) {
  const tripId = Number(req.params.tripId);
  const playerId = req.body.player_id;
  const clientId = req.body.client_id;
  const trip = await models.Trip.findByPk(tripId);
  const event = _.omit(req.body, ['client_id', 'player_id']);
  authz.checkRecord(req, 'event', models.Trip, trip);
  await applyEvent(req, [trip], event, playerId, clientId);
  res.status(200);
  res.json({ data: { ok: true } });
}

async function createGroupEventRoute(req, res) {
  const groupId = Number(req.params.groupId);
  const playerId = req.body.player_id;
  const clientId = req.body.client_id;
  
  const group = await models.Group.findByPk(groupId);
  authz.checkRecord(req, 'event', models.Group, group);

  const trips = await models.Trip.findAll({
    where: { groupId: groupId, isArchived: false }
  });
  const event = _.omit(req.body, ['client_id', 'player_id']);
  await applyEvent(req, trips, event, playerId, clientId);
  res.status(200);
  res.json({ data: { ok: true } });
}

/**
 * Update the device state.
 */
async function updateDeviceStateRoute(req, res) {
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
}

module.exports = {
  createGroupActionRoute,
  createGroupEventRoute,
  createTripActionRoute,
  createTripEventRoute,
  updateDeviceStateRoute
};
