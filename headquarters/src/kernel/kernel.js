const _ = require('lodash');

const Kernel = require('fptcore/src/kernel/kernel');

const { instrumentAsync } = require('../sentry');
const config = require('../config');
const ActionController = require('../controllers/action');
const KernelOpController = require('./op');
const ActionContext = require('./action_context');

const logger = config.logger.child({ name: 'kernel.kernel' });

class KernelController {
  static async _applyOp(actionContext, op) {
    await KernelOpController.applyOp(actionContext._objs, op);
  }

  static async _applyOps(actionContext, ops) {
    for (const op of ops) {
      await this._applyOp(actionContext, op);
    }
  }

  static async _applyResult(actionContext, result) {
    await this._applyOps(actionContext, result.resultOps);
    for (const action of result.scheduledActions) {
      await ActionController.scheduleAction(actionContext._objs.trip, action,
        actionContext.triggeringPlayerId);
    }
  }

  /**
   * Apply an action and gather the results.
   */
  static async applyAction(tripId, action, triggeringPlayerId=null, applyAt=null) {
    logger.info(action.params, 
      `(Trip #${tripId})${triggeringPlayerId ? ` (Player #${triggeringPlayerId})` : ''} ` +
      `Applying action: ${action.name}.`);
    return await instrumentAsync('kernel', 'action', async () => {
      const actionContext = await ActionContext.createForTripId(tripId, triggeringPlayerId, applyAt);
      const result = Kernel.resultForImmediateAction(action, actionContext);
      await this._applyResult(actionContext, result);
      return result;
    });
  }

  /**
   * Apply an action and gather the results.
   */
  static async applyEvent(tripId, event, triggeringPlayerId=null, applyAt=null) {
    logger.info(event,
      `(Trip #${tripId})${triggeringPlayerId ? ` (Player #${triggeringPlayerId})` : ''}  ` +
      `Applying event: ${event.type}.`);
    return await instrumentAsync('kernel', 'event', async () => {
      const actionContext = await ActionContext.createForTripId(tripId, triggeringPlayerId, applyAt);
      const result = Kernel.resultForEvent(event, actionContext);
      await this._applyResult(actionContext, result);
      return result;
    });
  }

  /**
   * Apply an action and gather the results.
   */
  static async applyTrigger(tripId, triggerName, event, triggeringPlayerId=null, applyAt=null) {
    logger.info(`(Trip #${tripId}) Applying trigger: ${triggerName}.`);
    return await instrumentAsync('kernel', 'trigger', async () => {
      const actionContext = await ActionContext.createForTripId(tripId, triggeringPlayerId, applyAt);
      const trigger = _.find(actionContext._objs.script.content.triggers || [], { name: triggerName });
      if (!trigger) {
        return null;
      }
      const result = Kernel.resultForTrigger(trigger, event, actionContext, actionContext);
      await this._applyResult(actionContext, result);
      return result;
    });
  }
}

module.exports = KernelController;
