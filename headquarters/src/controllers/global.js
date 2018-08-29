const _ = require('lodash');
const moment = require('moment');
const Sequelize = require('sequelize');

const config = require('../config');
const models = require('../models');
const TripActionController = require('./trip_action');

const logger = config.logger.child({ name: 'controllers.global' });

/**
 * Run a single scheduled action and update the database object.
 */
async function runScheduledAction(action, safe=false) {
  logger.info(action.params,
    `Running scheduled action ${action.name} #${action.id}`);
  const scheduledAction = _.pick(action, ['name', 'params', 'event']);
  const now = moment.utc();
  const scheduledAt = moment.utc(action.scheduledAt);
  const applyAt = scheduledAt.isSameOrBefore(now) ? scheduledAt : now;
  try {
    await TripActionController.applyAction(
      action.playthroughId, scheduledAction, applyAt);
    await action.update({ appliedAt: now });
  } catch(err) {
    if (!safe) {
      throw err;
    }
    // Otherwise log failure and continue.
    logger.error(`Error processing action ${action.name} #${action.id}:\n\n` + err);
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
  runScheduledActions: runScheduledActions
};

module.exports = GlobalController;
