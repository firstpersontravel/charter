const authz = require('../authorization/authz');
const models = require('../models');
const KernelController = require('../kernel/kernel');
const NotifyController = require('../controllers/notify');
const TripResetHandler = require('../handlers/trip_reset');

async function updateRelaysRoute(req, res) {
  const experience = await models.Experience.findByPk(req.params.experienceId);
  res.loggingOrgId = experience.orgId;
  authz.checkRecord(req, 'update', models.Experience, experience);
  res.json({ data: { ok: true } });
}

async function notifyRoute(req, res) {
  const trip = await models.Trip.findByPk(req.params.tripId);
  res.loggingOrgId = trip.orgId;
  authz.checkRecord(req, 'notify', models.Trip, trip);
  await NotifyController.notify(trip.id, req.body.notify_type);
  res.json({ data: { ok: true } });
}

async function resetRoute(req, res) {
  const trip = await models.Trip.findByPk(req.params.tripId);
  res.loggingOrgId = trip.orgId;
  authz.checkRecord(req, 'reset', models.Trip, trip);
  await TripResetHandler.resetToStart(trip.id);
  res.json({ data: { ok: true } });
}

async function triggerRoute(req, res) {
  const tripId = req.params.tripId;
  const trip = await models.Trip.findByPk(req.params.tripId);
  res.loggingOrgId = trip.orgId;
  authz.checkRecord(req, 'trigger', models.Trip, trip);
  const triggerName = req.body.trigger_name;
  const event = req.body.event;
  await KernelController.applyTrigger(tripId, triggerName, event);
  await NotifyController.notifyTrigger(tripId, triggerName);
  res.json({ data: { ok: true } });
}

module.exports = {
  notifyRoute,
  resetRoute,
  triggerRoute,
  updateRelaysRoute
};
