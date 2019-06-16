const _ = require('lodash');
const moment = require('moment');

const Kernel = require('../../../fptcore/src/kernel/kernel');

const config = require('../config');
const KernelOpController = require('./op');
const KernelUtil = require('./util');
const models = require('../models');

const logger = config.logger.child({ name: 'kernel.kernel' });

class KernelController {
  /**
   * Intermediate function.
   */
  static _resultForImmediateActionAndObjs(objs, action, evaluateAt) {
    const actionContext = KernelUtil.prepareActionContext(objs, evaluateAt);
    return Kernel.resultForImmediateAction(action, actionContext);
  }

  static _resultForEventAndObjs(objs, event, evaluateAt) {
    const actionContext = KernelUtil.prepareActionContext(objs, evaluateAt);
    return Kernel.resultForEvent(event, actionContext);
  }

  static _resultForTriggerAndObjs(objs, trigger, evaluateAt) {
    const actionContext = KernelUtil.prepareActionContext(objs, evaluateAt);
    return Kernel.resultForTrigger(trigger, null, actionContext,
      actionContext);
  }
  
  static async _scheduleAction(orgId, tripId, action) {
    const scheduleAtLocal = action.scheduleAt
      .clone()
      .tz('US/Pacific')
      .format('h:mm:ssa z');
    logger.info(action.params,
      `Scheduling ${action.name} for ${scheduleAtLocal}.`);
    const fields = {
      orgId: orgId,
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

  static async _scheduleActions(orgId, tripId, actions) {
    for (const action of actions) {
      await this._scheduleAction(orgId, tripId, action);
    }
  }

  static async _applyOps(objs, ops) {
    for (const op of ops) {
      await KernelOpController.applyOp(objs, op);
    }
  }

  static async _applyResult(objs, result) {
    await this._applyOps(objs, result.resultOps);
    await this._scheduleActions(objs.trip.orgId, objs.trip.id,
      result.scheduledActions);
  }

  /**
   * Apply an action and gather the results.
   */
  static async applyAction(tripId, action, applyAt) {
    logger.info(action.params, `Applying action: ${action.name}.`);
    const evaluateAt = applyAt || moment.utc();
    const objs = await KernelUtil.getObjectsForTrip(tripId);
    const result = this._resultForImmediateActionAndObjs(objs, action,
      evaluateAt);
    await this._applyResult(objs, result);
    return result;
  }

  /**
   * Apply an action and gather the results.
   */
  static async applyEvent(tripId, event, applyAt) {
    logger.info(event, `Applying event: ${event.type}.`);
    const evaluateAt = applyAt || moment.utc();
    const objs = await KernelUtil.getObjectsForTrip(tripId);
    const result = this._resultForEventAndObjs(objs, event, evaluateAt);
    await this._applyResult(objs, result);
    return result;
  }

  /**
   * Apply an action and gather the results.
   */
  static async applyTrigger(tripId, triggerName, applyAt) {
    logger.info(`Applying trigger: ${triggerName}.`);
    const evaluateAt = applyAt || moment.utc();
    const objs = await KernelUtil.getObjectsForTrip(tripId);
    const trigger = _.find(objs.script.content.triggers || [],
      { name: triggerName });
    if (!trigger) {
      return null;
    }
    const result = this._resultForTriggerAndObjs(objs, trigger,
      evaluateAt);
    await this._applyResult(objs, result);
    return result;
  }
}

module.exports = KernelController;
