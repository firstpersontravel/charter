const _ = require('lodash');
const moment = require('moment');
const Sequelize = require('sequelize');

const fptCore = require('fptcore');

const config = require('../config');
const models = require('../models');
const TripActionController = require('./trip_action');
const TripUtil = require('./trip_util');

const logger = config.logger.child({ name: 'controllers.global' });

/**
 * Schedule actions for all active playthroughs.
 */
async function scheduleActions(upToThreshold) {
  const playthroughs = await models.Playthrough.findAll({
    where: {
      isArchived: false,
      lastScheduledTime: {
        [Sequelize.Op.or]: [
          null,
          { [Sequelize.Op.lte]: upToThreshold.toDate() },
        ]
      }
    }
  });
  for (const playthrough of playthroughs) {
    logger.info('Checking playthrough', playthrough.id, 'up to', upToThreshold);
    await scheduleTripActions(playthrough.id, upToThreshold);
    await playthrough.update({ lastScheduledTime: upToThreshold.toDate() });
  }
}

/**
 * Get all triggers that should fire based on time elapsing.
 */
function getTimeOccuranceActions(objs, context, upToThreshold) {
  const now = moment.utc();
  const lastDate = objs.playthrough.lastScheduledTime;
  const lastTimestamp = lastDate ? moment.utc(lastDate).unix() : null;
  const toTimestamp = upToThreshold.unix();

  // Create time occurred event
  const timeOccurredEvent = {
    type: 'time_occurred',
    last_timestamp: lastTimestamp,
    to_timestamp: toTimestamp
  };

  const timeOccurredTriggers = fptCore.TriggerEventCore.triggersForEvent(
    objs.script, context, timeOccurredEvent);

  return timeOccurredTriggers.map(function(trigger) {
    // Get intended time of time occurred trigger
    const timeOccurredTriggerEvent = (
      fptCore.TriggerEventCore.triggerEventForEventType(
        trigger, 'time_occurred'
      )
    );
    const intendedAt = fptCore.Events.time_occurred.timeForSpec(
      context, timeOccurredTriggerEvent.time_occurred);
    const scheduleAt = intendedAt.isAfter(now) ? intendedAt : now;
    // Construct schdeduled action
    return {
      playthroughId: objs.playthrough.id,
      type: 'trigger',
      name: trigger.name,
      params: {},
      triggerName: '',
      createdAt: moment.utc(),
      scheduledAt: scheduleAt
    };
  });
}

/**
 * Schedule actions for a playthrough.
 */
async function scheduleTripActions(playthroughId, upToThreshold) {
  const objs = await TripUtil.getObjectsForPlaythrough(playthroughId);
  const playthrough = objs.playthrough;
  const context = TripUtil.createContext(objs);

  const now = moment.utc();

  // Get actions based on occurance of time.
  const actions = getTimeOccuranceActions(objs, context, upToThreshold);

  // Add scene start event if needed -- only if we have just reset since
  // otherwise we might get into an infinite loop if the workers are backed
  // up or not running.
  if (!playthrough.lastScheduledTime && !playthrough.currentSceneName) {
    const firstSceneName = fptCore.SceneCore.getStartingSceneName(
      objs.script, context);
    if (firstSceneName) {
      actions.push({
        playthroughId: objs.playthrough.id,
        type: 'action',
        name: 'start_scene',
        params: { scene_name: firstSceneName },
        triggerName: '',
        createdAt: now,
        scheduledAt: now
      });
    }
  }

  for (let action of actions) {
    logger.info(action, `Scheduling ${action.type} ${action.name}.`);
    await models.Action.create(action);
  }
}

async function internalRunScheduledAction(action) {
  const now = moment.utc();
  const scheduledAt = moment.utc(action.scheduledAt);
  const applyAt = scheduledAt.isSameOrBefore(now) ? scheduledAt : now;
  const playthroughId = action.playthroughId;
  if (action.type === 'action') {
    const scheduledAction = _.pick(action, ['name', 'params', 'event']);
    await TripActionController.applyAction(playthroughId, scheduledAction,
      applyAt);
  } else if (action.type === 'trigger') {
    await TripActionController.applyTrigger(playthroughId, action.name,
      applyAt);
  } else if (action.type === 'event') {
    const event = Object.assign({ type: action.name }, action.params);
    await TripActionController.applyEvent(playthroughId, event, applyAt);
  }
}

/**
 * Run a single scheduled action and update the database object.
 */
async function runScheduledAction(action, safe=false) {
  logger.info(action.params,
    `Running scheduled ${action.type} ${action.name} #${action.id}`);
  const now = moment.utc();
  try {
    await internalRunScheduledAction(action);
    await action.update({ appliedAt: now });
  } catch(err) {
    if (!safe) {
      throw err;
    }
    // Otherwise log failure and continue.
    logger.error(`Error processing ${action.type} ${action.name} #${action.id}:\n\n` + err);
    await action.update({ failedAt: now });
  }
}

/**
 * Run all scheduled actions with some parameters.
 */
async function runScheduledActions(upToThreshold=null, playthroughId=null,
  safe=false) {
  const where = {
    isArchived: false,
    appliedAt: null,
    failedAt: null
  };
  if (upToThreshold) {
    where.scheduledAt = { [Sequelize.Op.lte]: upToThreshold.toDate() };
  }
  if (playthroughId) {
    where.playthroughId = playthroughId;
  }
  const actions = await models.Action.findAll({
    order: [['scheduledAt', 'ASC'], ['id', 'ASC']],
    where: where,
    include: [{
      model: models.Playthrough,
      as: 'playthrough',
      where: {
        isArchived: false
      }
    }]
  });
  for (let action of actions) {
    await runScheduledAction(action, safe);
  }
}

const GlobalController = {
  scheduleActions: scheduleActions,
  runScheduledActions: runScheduledActions
};

module.exports = GlobalController;
