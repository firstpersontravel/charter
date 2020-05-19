const moment = require('moment');

const models = require('../models');
const ExperienceController = require('../controllers/experience');
const RunnerWorker = require('../workers/runner');
const KernelController = require('../kernel/kernel');
const NotifyController = require('../controllers/notify');
const TripResetHandler = require('../handlers/trip_reset');

async function updateRelaysRoute(req, res) {
  await ExperienceController.ensureEntrywayRelays(req.params.experienceId);
  res.json({ data: { ok: true } });
}

async function notifyRoute(req, res) {
  const tripId = req.params.tripId;
  await NotifyController.notify(tripId, req.body.notify_type);
  res.json({ data: { ok: true } });
}

async function fastForwardRoute(req, res) {
  const tripId = req.params.tripId;
  await RunnerWorker.runScheduledActions(null, tripId, true);
  await NotifyController.notify(tripId, 'reload');
  res.json({ data: { ok: true } });
}

async function fastForwardNextRoute(req, res) {
  const tripId = req.params.tripId;
  const nextAction = await models.Action.findOne({
    where: { tripId: tripId, appliedAt: null, failedAt: null },
    order: [['scheduledAt', 'ASC'], ['id', 'ASC']]
  });
  if (nextAction) {
    const upToThreshold = moment.utc(nextAction.scheduledAt);
    await RunnerWorker.runScheduledActions(upToThreshold, tripId, true);
    await NotifyController.notify(tripId, 'refresh');
  }
  res.json({ data: { ok: true } });
}

async function resetRoute(req, res) {
  const tripId = req.params.tripId;
  await TripResetHandler.resetToStart(tripId);
  res.json({ data: { ok: true } });
}

async function triggerRoute(req, res) {
  const tripId = req.params.tripId;
  const triggerName = req.body.trigger_name;
  const event = req.body.event;
  await KernelController.applyTrigger(tripId, triggerName, event);
  await NotifyController.notifyTrigger(tripId, triggerName);
  res.json({ data: { ok: true } });
}

module.exports = {
  fastForwardRoute,
  fastForwardNextRoute,
  notifyRoute,
  resetRoute,
  triggerRoute,
  updateRelaysRoute
};
