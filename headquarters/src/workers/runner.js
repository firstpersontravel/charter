const _ = require('lodash');
const moment = require('moment');
const Sequelize = require('sequelize');

const config = require('../config');
const models = require('../models');
const TripActionController = require('../controllers/trip_action');

const logger = config.logger.child({ name: 'workers.runner' });

class RunnerWorker {
  /**
   * Internal function to run actions
   */
  static async _unsafeRunScheduledAction(action) {
    const now = moment.utc();
    const scheduledAt = moment.utc(action.scheduledAt);
    const applyAt = scheduledAt.isSameOrBefore(now) ? scheduledAt : now;
    const tripId = action.tripId;
    if (action.type === 'action') {
      const scheduledAction = _.pick(action, ['name', 'params', 'event']);
      await TripActionController.applyAction(tripId, scheduledAction,
        applyAt);
    } else if (action.type === 'trigger') {
      await TripActionController.applyTrigger(tripId, action.name,
        applyAt);
    } else if (action.type === 'event') {
      const event = Object.assign({ type: action.name }, action.params);
      await TripActionController.applyEvent(tripId, event, applyAt);
    }
  }

  /**
   * Run a single scheduled action and update the database object.
   */
  static async _runScheduledAction(action, safe=false) {
    logger.info(action.params,
      `Running scheduled ${action.type} ${action.name} #${action.id}`);
    const now = moment.utc();
    try {
      await this._unsafeRunScheduledAction(action);
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
  static async runScheduledActions(threshold, tripId=null, safe=false) {
    const where = { isArchived: false, appliedAt: null, failedAt: null };
    if (threshold) {
      where.scheduledAt = { [Sequelize.Op.lte]: threshold.toDate() };
    }
    if (tripId) {
      where.tripId = tripId;
    }
    const actions = await models.Action.findAll({
      order: [['scheduledAt', 'ASC'], ['id', 'ASC']],
      where: where,
      include: [{
        model: models.Trip,
        as: 'trip',
        where: { isArchived: false }
      }]
    });
    for (let action of actions) {
      await this._runScheduledAction(action, safe);
    }
  }
}

module.exports = RunnerWorker;
