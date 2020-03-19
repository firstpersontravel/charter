const _ = require('lodash');
const moment = require('moment');
const Sequelize = require('sequelize');

const Registry = require('../../../fptcore/src/registry/registry');
const KernelTriggers = require('../../../fptcore/src/kernel/triggers');

const config = require('../config');
const models = require('../models');
const KernelUtil = require('../kernel/util');

const logger = config.logger.child({ name: 'workers.scheduler' });

class SchedulerWorker {
  /**
   * Get time that a trigger is supposed to be triggered at.
   */
  static _getTriggerIntendedAt(trigger, actionContext) {
    const intendedAt = Registry.events.time_occurred.timeForSpec(
      trigger.event, actionContext.evalContext);
    return intendedAt;    
  }

  /**
   * Get all triggers that should fire based on time elapsing.
   */
  static _getTimeOccuranceActions(trip, actionContext, threshold) {
    const now = moment.utc();
    const toTimestamp = threshold.unix();

    // Create time occurred event
    const timeOccurredEvent = {
      type: 'time_occurred',
      timestamp: toTimestamp
    };

    const triggers = KernelTriggers.triggersForEvent(timeOccurredEvent,
      actionContext);

    return triggers.map((trigger) => {
      const intendedAt = this._getTriggerIntendedAt(trigger, actionContext);
      const scheduleAt = intendedAt.isAfter(now) ? intendedAt : now;
      // Construct schdeduled action
      return {
        orgId: trip.orgId,
        tripId: trip.id,
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

  static getNextTriggerAndTime(objs) {
    const now = moment.utc();
    const actionContext = KernelUtil.prepareActionContext(objs, now);
    const nextTriggerWithTime = _(objs.script.content.triggers)
      .filter(trigger => (
        trigger.event && trigger.event.type === 'time_occurred'
      ))
      .filter(trigger => !objs.trip.history[trigger.name])
      .map(trigger => (
        [trigger, this._getTriggerIntendedAt(trigger, actionContext)]
      ))
      .filter(triggerAndTime => !!triggerAndTime[1])
      .sortBy(triggerAndTime => triggerAndTime[1].unix())
      .value()[0];
    if (!nextTriggerWithTime) {
      return [null, null];
    }
    if (nextTriggerWithTime[1].isBefore(now)) {
      return [nextTriggerWithTime[0], now];
    }
    return nextTriggerWithTime;
  }

  /**
   * Update scheduleAt time for a single trip.
   */
  static async _updateTripNextScheduleAt(tripId) {
    const now = moment.utc();
    const objs = await KernelUtil.getObjectsForTrip(tripId);
    const [nextTrigger, nextTime] = this.getNextTriggerAndTime(objs);

    await objs.trip.update({
      scheduleUpdatedAt: now.toDate(),
      scheduleAt: nextTime ? nextTime.toDate() : null
    });

    if (nextTime) {
      const nextTimeLocal = nextTime.clone()
        .tz('US/Pacific')
        .format('MMM DD, h:mm:ssa z');
      logger.info(
        `Updating scheduleAt for ${objs.trip.experience.title} ` + 
        `"${objs.trip.title}" to ${nextTimeLocal}. (${JSON.stringify(nextTrigger)})`);
    } else {
      logger.info(
        `No upcoming scheduled actions for ${objs.trip.experience.title} ` + 
        `"${objs.trip.title}".`);
    }

  }

  /**
   * Schedule actions for all active trips.
   */
  static async scheduleActions(threshold) {
    const thresholdLocal = threshold.clone()
      .tz('US/Pacific')
      .format('MMM DD, h:mm:ssa z');
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
    for (const trip of trips) {
      logger.info(
        `Checking ${trip.experience.title} "${trip.title}" ` +
        `up to ${thresholdLocal}`);
      await this._scheduleTripActions(trip.id, threshold);
      await this._updateTripNextScheduleAt(trip.id);
    }
  }

  /**
   * Schedule actions for a trip.
   */
  static async _scheduleTripActions(tripId, threshold) {
    const objs = await KernelUtil.getObjectsForTrip(tripId);
    const trip = objs.trip;
    const now = moment.utc();
    const actionContext = KernelUtil.prepareActionContext(objs, now);

    // Get actions based on occurance of time.
    const actions = this._getTimeOccuranceActions(trip, actionContext,
      threshold);

    for (let action of actions) {
      logger.info({ action: action },
        `Scheduling ${action.type} ${action.name}.`);
      await models.Action.create(action);
    }
  }
}

module.exports = SchedulerWorker;
