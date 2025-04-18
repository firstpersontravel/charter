const _ = require('lodash');
const moment = require('moment');
const Sequelize = require('sequelize');
const Sentry = require('@sentry/node');

const coreRegistry = require('fptcore/src/core-registry');
const KernelTriggers = require('fptcore/src/kernel/triggers');

const config = require('../config.ts');
const models = require('../models');
const ActionContext = require('../kernel/action_context');
const { fmtLocal } = require('./util');

const logger = config.logger.child({ name: 'workers.scheduler' });

class SchedulerWorker {
  /**
   * Get time that a trigger is supposed to be triggered at.
   */
  static _getTriggerIntendedAt(trigger, actionContext) {
    const intendedAt = coreRegistry.events.time_occurred.timeForSpec(
      trigger.event, actionContext.evalContext);
    return intendedAt;    
  }

  /**
   * Get all triggers that should fire based on time elapsing.
   */
  static _getTimeOccuranceActions(actionContext, threshold) {
    const toTimestamp = threshold.unix();

    // Create time occurred event
    const timeOccurredEvent = {
      type: 'time_occurred',
      timestamp: toTimestamp
    };

    const triggers = KernelTriggers.triggersForEvent(timeOccurredEvent, actionContext);
    return triggers.map((trigger) => {
      const intendedAt = this._getTriggerIntendedAt(trigger, actionContext);
      const scheduleAt = intendedAt.isAfter(actionContext.evaluateAt) ?
        intendedAt : actionContext.evaluateAt;
      // Construct scheduled action
      return {
        orgId: actionContext._objs.trip.orgId,
        tripId: actionContext._objs.trip.id,
        triggeringPlayerId: actionContext.triggeringPlayer ? actionContext.triggeringPlayer.id : null,
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
   * Update scheduleAt time for all trips where the trip or the script has
   * been updated after the schedule was updated.
   */
  static async updateScheduleAts() {
    // Find all trips where the scheduleAt needs updating -- which means if
    // the trip or script was updated more recently than scheduling happened.
    const trips = await models.Trip.findAll({
      where: Sequelize.literal(
        '`Trip`.`is_archived` = 0 AND (' +
          '`Trip`.`updated_at` > `Trip`.`schedule_updated_at` OR ' +
          '`script`.`updated_at` > `Trip`.`schedule_updated_at` OR ' +
          '`Trip`.`schedule_updated_at` IS NULL' +
        ')'
      ),
      include: [{
        model: models.Experience,
        as: 'experience',
        where: { isArchived: false }
      }, {
        model: models.Script,
        as: 'script'
      }]
    });
    for (const trip of trips) {
      await this._updateTripNextScheduleAt(trip.id);
    }
  }

  static getNextTriggerAndTime(actionContext) {
    // Create time occurred event for 10 years from now.
    const timeOccurredEvent = {
      type: 'time_occurred',
      timestamp: actionContext.evaluateAt.clone().add(10, 'years').unix()
    };
    const triggers = KernelTriggers.triggersForEvent(timeOccurredEvent,
      actionContext);

    const nextTriggerWithTime = _(triggers)
      .map(trigger => (
        [trigger, this._getTriggerIntendedAt(trigger, actionContext)]
      ))
      .sortBy(triggerAndTime => triggerAndTime[1].unix())
      .value()[0];

    if (!nextTriggerWithTime) {
      return [null, null];
    }
    if (nextTriggerWithTime[1].isBefore(actionContext.evaluateAt)) {
      return [nextTriggerWithTime[0], actionContext.evaluateAt];
    }
    return nextTriggerWithTime;
  }

  /**
   * Update scheduleAt time for a single trip.
   */
  static async _updateTripNextScheduleAt(tripId) {
    const now = moment.utc();
    const actionContext = await ActionContext.createForTripId(tripId, null, now);
    const [nextTrigger, nextTime] = this.getNextTriggerAndTime(actionContext);
    const trip = actionContext._objs.trip;
    await trip.update({
      scheduleUpdatedAt: now.toDate(),
      scheduleAt: nextTime ? nextTime.toDate() : null
    });

    if (nextTime) {
      logger.info(
        `Updating scheduleAt for ${trip.experience.title} ` + 
        `"${trip.title}" to ${fmtLocal(nextTime)}. (${JSON.stringify(nextTrigger)})`);
    } else {
      logger.info(
        `No upcoming scheduled actions for ${trip.experience.title} ` + 
        `"${trip.title}".`);
    }

  }

  /**
   * Schedule actions for all active trips.
   */
  static async scheduleActions(threshold) {
    // Find all trips where the schedule needs updating -- which means if
    // the trip or script was updated more recently than scheduling happened.
    const trips = await models.Trip.findAll({
      where: {
        isArchived: false,
        scheduleAt: { [Sequelize.Op.lte]: threshold.toDate() }
      },
      include: [{
        model: models.Experience,
        as: 'experience',
        where: { isArchived: false }
      }]
    });
    // logger.info(
    //   `Scheduling ${trips.length} trips up to ${fmtLocal(threshold)}`);
    for (const trip of trips) {
      logger.info(
        `Scheduling ${trip.experience.title} "${trip.title}" ` +
        `up to ${fmtLocal(threshold)}`);
      await this._scheduleTripActions(trip.id, threshold);
      await this._updateTripNextScheduleAt(trip.id);
    }
  }

  /**
   * Schedule actions for a trip.
   */
  static async _scheduleTripActions(tripId, threshold) {
    const transaction = Sentry.startTransaction({
      name: 'SCHEDULE',
      op: 'worker.scheduler'
    });

    // We put the transaction on the scope so users can attach children to it
    Sentry.getCurrentHub().configureScope(scope => {
      scope.setSpan(transaction);
    });

    try {
      const actionContext = await ActionContext.createForTripId(tripId);

      // Get actions based on occurance of time.
      const actions = this._getTimeOccuranceActions(actionContext, threshold);
      // logger.info(
      //   `Found ${actions.length} actions for ${trip.experience.title} ` +
      //   `"${trip.title}" up to ${fmtLocal(threshold)}`);

      for (let action of actions) {
        logger.info({ action: action },
          `Scheduling ${action.type} ${action.name} at ` +
          `${fmtLocal(action.scheduledAt)}.`);
        await models.Action.create(action);
      }
    } finally {
      transaction.finish();
    }
  }
}

module.exports = SchedulerWorker;
