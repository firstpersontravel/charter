const _ = require('lodash');
const moment = require('moment');

const fptCore = require('fptcore');

const config = require('../config');
const TripOpController = require('./trip_op');
const TripUtil = require('./trip_util');
const models = require('../models');

const logger = config.logger.child({ name: 'controllers.trip_action' });

/**
 * Intermediate function.
 */
function getResultsForActionAndObjs(objs, action, applyAt) {
  var context = TripUtil.createContext(objs);
  var script = objs.script.get({ plain: true });
  return fptCore.ActionCore.applyAction(script, context, action,
    applyAt || moment.utc());
}

function getResultsForEventAndObjs(objs, event, applyAt) {
  var context = TripUtil.createContext(objs);
  var script = objs.script.get({ plain: true });
  return fptCore.ActionCore.applyEvent(script, context, event,
    applyAt || moment.utc());
}

function getResultsForTriggerAndObjs(objs, trigger, applyAt) {
  var context = TripUtil.createContext(objs);
  var script = objs.script.get({ plain: true });
  return fptCore.ActionCore.applyTrigger(script, context, context, trigger,
    null, applyAt || moment.utc());
}

/**
 * Schedule an action.
 */
async function scheduleAction(playthroughId, action) {
  logger.info(
    action.params,
    `Scheduling action ${action.scheduleAt.fromNow()}: ` + 
    `${action.name}.`);
  const fields = {
    playthroughId: playthroughId,
    type: 'action',
    name: action.name,
    params: action.params,
    triggerName: action.triggerName || '',
    event: action.event || null,
    createdAt: moment.utc().toDate(),
    scheduledAt: action.scheduleAt.toDate(),
    appliedAt: null,
    failedAt: null
  };
  return await models.Action.create(fields);
}

/**
 * Schedule actions.
 */
async function scheduleActions(playthroughId, actions) {
  for (let action of actions) {
    await scheduleAction(playthroughId, action);
  }
}

async function applyOps(objs, ops) {
  for (let op of ops) {
    await TripOpController.applyOp(objs, op);
  }
}

async function applyResult(objs, result) {
  await applyOps(objs, result.resultOps);
  await scheduleActions(objs.playthrough.id, result.scheduledActions);
}

/**
 * Apply an action and gather the results.
 */
async function applyAction(playthroughId, action, applyAt) {
  logger.info(action.params, `Applying action: ${action.name}.`);
  const objs = await TripUtil.getObjectsForPlaythrough(playthroughId);
  const result = getResultsForActionAndObjs(objs, action, applyAt);
  await applyResult(objs, result);
  return result;
}

/**
 * Apply an action and gather the results.
 */
async function applyEvent(playthroughId, event, applyAt) {
  logger.info(event, `Applying event: ${event.type}.`);
  const objs = await TripUtil.getObjectsForPlaythrough(playthroughId);
  const result = getResultsForEventAndObjs(objs, event, applyAt);
  await applyResult(objs, result);
  return result;
}

/**
 * Apply an action and gather the results.
 */
async function applyTrigger(playthroughId, triggerName, applyAt) {
  logger.info(`Applying trigger: ${triggerName}.`);
  const objs = await TripUtil.getObjectsForPlaythrough(playthroughId);
  const trigger = _.find(objs.script.content.triggers || [],
    { name: triggerName });
  if (!trigger) {
    return null;
  }
  const result = getResultsForTriggerAndObjs(objs, trigger, applyAt);
  await applyResult(objs, result);
  return result;
}

const TripActionController = {
  applyAction: applyAction,
  applyEvent: applyEvent,
  applyTrigger: applyTrigger,
  scheduleAction: scheduleAction
};

module.exports = TripActionController;
