const moment = require('moment');

const { ActionPhraseCore } = require('fptcore');

const models = require('../models');
const ExperienceController = require('../controllers/experience');
const RunnerWorker = require('../workers/runner');
const TripActionController = require('../controllers/trip_action');
const TripNotifyController = require('../controllers/trip_notify');
const TripResetController = require('../controllers/trip_reset');
const TripUtil = require('../controllers/trip_util');

async function updateRelaysRoute(req, res) {
  await ExperienceController.ensureTrailheads(req.params.experienceId);
  res.json({ data: { ok: true } });
}

async function notifyRoute(req, res) {
  const tripId = req.params.tripId;
  await TripNotifyController.notify(tripId, req.body.notify_type);
  res.json({ data: { ok: true } });
}

async function fastForwardRoute(req, res) {
  const tripId = req.params.tripId;
  await RunnerWorker.runScheduledActions(null, tripId, true);
  await TripNotifyController.notify(tripId, 'reload');
  res.json({ data: { ok: true } });
}

async function fastForwardNextRoute(req, res) {
  const tripId = req.params.tripId;
  const nextAction = await models.Action.find({
    where: { tripId: tripId, appliedAt: null, failedAt: null },
    order: [['scheduledAt', 'ASC'], ['id', 'ASC']]
  });
  if (nextAction) {
    const upToThreshold = moment.utc(nextAction.scheduledAt);
    await RunnerWorker.runScheduledActions(upToThreshold, tripId, true);
    await TripNotifyController.notify(tripId, 'refresh');
  }
  res.json({ data: { ok: true } });
}

async function resetRoute(req, res) {
  const tripId = req.params.tripId;
  const checkpointName = req.body.checkpoint_name;
  await TripResetController.resetToCheckpoint(tripId, checkpointName);
  res.json({ data: { ok: true } });
}

async function phraseRoute(req, res) {
  const tripId = req.params.tripId;
  const actionPhrase = req.body.action_phrase;
  const actionContext = await TripUtil.getActionContext(tripId);
  const packedAction = ActionPhraseCore.parseActionPhrase(actionPhrase, 
    actionContext);
  const unpackedAction = ActionPhraseCore.unpackAction(packedAction,
    actionContext);
  if (packedAction.when) {
    await TripActionController.scheduleAction(tripId, unpackedAction);
  } else {
    await TripActionController.applyAction(tripId, unpackedAction);
  }
  await TripNotifyController.notifyAction(tripId, unpackedAction);
  res.json({ data: { ok: true } });
}

async function triggerRoute(req, res) {
  const tripId = req.params.tripId;
  const triggerName = req.body.trigger_name;
  await TripActionController.applyTrigger(tripId, triggerName);
  await TripNotifyController.notifyTrigger(tripId, triggerName);
  res.json({ data: { ok: true } });
}

module.exports = {
  fastForwardRoute,
  fastForwardNextRoute,
  notifyRoute,
  phraseRoute,
  resetRoute,
  triggerRoute,
  updateRelaysRoute
};
