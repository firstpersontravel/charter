const moment = require('moment');
const Sequelize = require('sequelize');

const { TriggerEventCore, Events, SceneCore } = require('fptcore');

const config = require('../config');
const models = require('../models');
const TripUtil = require('../controllers/trip_util');

const logger = config.logger.child({ name: 'workers.scheduler' });

class SchedulerWorker {
  /**
   * Get all triggers that should fire based on time elapsing.
   */
  static _getTimeOccuranceActions(objs, context, threshold) {
    const now = moment.utc();
    const lastDate = objs.trip.lastScheduledTime;
    const lastTimestamp = lastDate ? moment.utc(lastDate).unix() : null;
    const toTimestamp = threshold.unix();

    // Create time occurred event
    const timeOccurredEvent = {
      type: 'time_occurred',
      last_timestamp: lastTimestamp,
      to_timestamp: toTimestamp
    };

    const triggers = TriggerEventCore.triggersForEvent(objs.script,
      context, timeOccurredEvent);

    return triggers.map(function(trigger) {
      // Get intended time of time occurred trigger
      const timeOccurredTriggerEvent = (
        TriggerEventCore.triggerEventForEventType(trigger, 'time_occurred')
      );
      const intendedAt = Events.time_occurred.timeForSpec(
        timeOccurredTriggerEvent.time_occurred, context);
      const scheduleAt = intendedAt.isAfter(now) ? intendedAt : now;
      // Construct schdeduled action
      return {
        tripId: objs.trip.id,
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
   * Schedule actions for a trip.
   */
  static async _scheduleTripActions(tripId, threshold) {
    const objs = await TripUtil.getObjectsForTrip(tripId);
    const trip = objs.trip;
    const context = TripUtil.createEvalContext(objs);
    const now = moment.utc();

    // Get actions based on occurance of time.
    const actions = this._getTimeOccuranceActions(objs, context, threshold);

    // Add scene start event if needed -- only if we have just reset since
    // otherwise we might get into an infinite loop if the workers are backed
    // up or not running.
    if (!trip.lastScheduledTime && !trip.currentSceneName) {
      const firstSceneName = SceneCore.getStartingSceneName(objs.script,
        context);
      if (firstSceneName) {
        actions.push({
          tripId: objs.trip.id,
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

  /**
   * Schedule actions for all active trips.
   */
  static async scheduleActions(threshold) {
    const trips = await models.Trip.findAll({
      where: {
        isArchived: false,
        lastScheduledTime: {
          [Sequelize.Op.or]: [
            null,
            { [Sequelize.Op.lte]: threshold.toDate() },
          ]
        }
      }
    });
    for (const trip of trips) {
      logger.info('Checking trip', trip.id, 'up to', threshold);
      await this._scheduleTripActions(trip.id, threshold);
      await trip.update({ lastScheduledTime: threshold.toDate() });
    }
  }
}

module.exports = SchedulerWorker;
