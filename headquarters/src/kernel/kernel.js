const _ = require('lodash');
const moment = require('moment');

const Kernel = require('fptcore/src/kernel/kernel');

const config = require('../config');
const ActionController = require('../controllers/action');
const KernelOpController = require('./op');
const KernelUtil = require('./util');

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

  static _resultForTriggerAndObjs(objs, trigger, event, evaluateAt) {
    const actionContext = KernelUtil.prepareActionContext(objs, evaluateAt);
    return Kernel.resultForTrigger(trigger, event, actionContext,
      actionContext);
  }

  static async _applyOp(objs, op) {
    await KernelOpController.applyOp(objs, op);
  }

  static async _applyOps(objs, ops) {
    for (const op of ops) {
      await this._applyOp(objs, op);
    }
  }

  static async _applyResult(objs, result) {
    await this._applyOps(objs, result.resultOps);
    for (const action of result.scheduledActions) {
      await ActionController.scheduleAction(objs.trip, action);
    }
  }

  /**
   * Apply an action and gather the results.
   */
  static async applyAction(tripId, action, applyAt) {
    logger.info(action.params, `(Trip #${tripId}) Applying action: ${action.name}.`);
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
    logger.info(event, `(Trip #${tripId}) Applying event: ${event.type}.`);
    const evaluateAt = applyAt || moment.utc();
    const objs = await KernelUtil.getObjectsForTrip(tripId);
    const result = this._resultForEventAndObjs(objs, event, evaluateAt);
    await this._applyResult(objs, result);
    return result;
  }

  /**
   * Apply an action and gather the results.
   */
  static async applyTrigger(tripId, triggerName, event, applyAt) {
    logger.info(`(Trip #${tripId}) Applying trigger: ${triggerName}.`);
    const evaluateAt = applyAt || moment.utc();
    const objs = await KernelUtil.getObjectsForTrip(tripId);
    const trigger = _.find(objs.script.content.triggers || [],
      { name: triggerName });
    if (!trigger) {
      return null;
    }
    const result = this._resultForTriggerAndObjs(objs, trigger, event,
      evaluateAt);
    await this._applyResult(objs, result);
    return result;
  }
}

module.exports = KernelController;
