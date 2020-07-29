const _ = require('lodash');

const Kernel = require('fptcore/src/kernel/kernel');

const config = require('../config');
const ActionController = require('../controllers/action');
const KernelOpController = require('./op');
const ActionContext = require('./action_context');

const logger = config.logger.child({ name: 'kernel.kernel' });

class KernelController {
  static async _applyOp(objs, op) {
    await KernelOpController.applyOp(objs, op);
  }

  static async _applyOps(objs, ops) {
    // TODO: consider whether this should be using actionContext rather than _objs
    for (const op of ops) {
      await this._applyOp(objs, op);
    }
  }

  static async _applyResult(actionContext, result) {
    await this._applyOps(actionContext._objs, result.resultOps);
    for (const action of result.scheduledActions) {
      // TL: eventually convert actionContext to always have a player
      await ActionController.scheduleAction(actionContext._objs.trip, action, actionContext.player ? actionContext.player.id : null);
    }
  }

  /**
   * Apply an action and gather the results.
   */
  static async applyAction(tripId, action, applyAt) {
    logger.info(action.params, `(Trip #${tripId}) Applying action: ${action.name}.`);
    // TL: for scheduled actions, this seems to be in action.event.player_id; for immediate actions, in params (potentially a cleanup opportunity here -- ensure action has player_id)
    const actingPlayerId = parseInt((action.params && action.params.player_id) || 
        (action.event && action.event.player_id));
    const actionContext = await ActionContext.createForTripId(tripId, applyAt, actingPlayerId);
    const result = Kernel.resultForImmediateAction(action, actionContext);
    await this._applyResult(actionContext, result);
    return result;
  }

  /**
   * Apply an action and gather the results.
   */
  static async applyEvent(tripId, event, applyAt) {
    logger.info(event, `(Trip #${tripId}) Applying event: ${event.type}.`);
    const actingPlayerId = parseInt(event.player_id);
    const actionContext = await ActionContext.createForTripId(tripId, applyAt, actingPlayerId);
    const result = Kernel.resultForEvent(event, actionContext);
    await this._applyResult(actionContext, result);
    return result;
  }

  /**
   * Apply an action and gather the results.
   */
  static async applyTrigger(tripId, triggerName, event, applyAt) {
    logger.info(`(Trip #${tripId}) Applying trigger: ${triggerName}.`);
    const actingPlayerId = parseInt(event.player_id);
    const actionContext = await ActionContext.createForTripId(tripId, applyAt, actingPlayerId);
    const trigger = _.find(actionContext._objs.script.content.triggers || [], { name: triggerName });
    if (!trigger) {
      return null;
    }
    const result = Kernel.resultForTrigger(trigger, event, actionContext, actionContext);
    await this._applyResult(actionContext, result);
    return result;
  }
}

module.exports = KernelController;
