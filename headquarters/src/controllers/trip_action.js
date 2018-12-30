const _ = require('lodash');
const moment = require('moment');

const { ActionCore } = require('fptcore');

const config = require('../config');
const TripOpController = require('./trip_op');
const TripUtil = require('./trip_util');
const models = require('../models');

const logger = config.logger.child({ name: 'controllers.trip_action' });

class TripActionController {

  /**
   * Prepare an object containing everything needed to evaluate actions.
   */
  static _prepareActionContext(objs, evaluateAt) {
    return {
      evaluateAt: evaluateAt,
      timezone: objs.experience.timezone,
      scriptContent: objs.script.content,
      evalContext: TripUtil.createEvalContext(objs)
    };
  }

  /**
   * Intermediate function.
   */
  static _getResultsForActionAndObjs(objs, action, applyAt) {
    const evaluateAt = applyAt || moment.utc();
    const actionContext = this._prepareActionContext(objs, evaluateAt);
    return ActionCore.applyAction(action, actionContext);
  }

  static _getResultsForEventAndObjs(objs, event, applyAt) {
    const evaluateAt = applyAt || moment.utc();
    const actionContext = this._prepareActionContext(objs, evaluateAt);
    return ActionCore.applyEvent(event, actionContext);
  }

  static _getResultsForTriggerAndObjs(objs, trigger, applyAt) {
    const evaluateAt = applyAt || moment.utc();
    const actionContext = this._prepareActionContext(objs, evaluateAt);
    return ActionCore.applyTrigger(trigger, null, actionContext);
  }
  
  static async _scheduleAction(tripId, action) {
    logger.info(
      action.params,
      `Scheduling action ${action.scheduleAt.fromNow()}: ` + 
      `${action.name}.`);
    const fields = {
      tripId: tripId,
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

  static async _scheduleActions(tripId, actions) {
    for (let action of actions) {
      await this._scheduleAction(tripId, action);
    }
  }

  static async _applyOps(objs, ops) {
    for (let op of ops) {
      await TripOpController.applyOp(objs, op);
    }
  }

  static async _applyResult(objs, result) {
    await this._applyOps(objs, result.resultOps);
    await this._scheduleActions(objs.trip.id, result.scheduledActions);
  }

  /**
   * Apply an action and gather the results.
   */
  static async applyAction(tripId, action, applyAt) {
    logger.info(action.params, `Applying action: ${action.name}.`);
    const objs = await TripUtil.getObjectsForTrip(tripId);
    const result = this._getResultsForActionAndObjs(objs, action, applyAt);
    await this._applyResult(objs, result);
    return result;
  }

  /**
   * Apply an action and gather the results.
   */
  static async applyEvent(tripId, event, applyAt) {
    logger.info(event, `Applying event: ${event.type}.`);
    const objs = await TripUtil.getObjectsForTrip(tripId);
    const result = this._getResultsForEventAndObjs(objs, event, applyAt);
    await this._applyResult(objs, result);
    return result;
  }

  /**
   * Apply an action and gather the results.
   */
  static async applyTrigger(tripId, triggerName, applyAt) {
    logger.info(`Applying trigger: ${triggerName}.`);
    const objs = await TripUtil.getObjectsForTrip(tripId);
    const trigger = _.find(objs.script.content.triggers || [],
      { name: triggerName });
    if (!trigger) {
      return null;
    }
    const result = this._getResultsForTriggerAndObjs(objs, trigger, applyAt);
    await this._applyResult(objs, result);
    return result;
  }
}

module.exports = TripActionController;
