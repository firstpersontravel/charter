const _ = require('lodash');

const ActionParamCore = require('./action_param');
const ActionPhraseCore = require('./action_phrase');
const ActionResultCore = require('./action_result');
const ActionsRegistry = require('../registries/actions');
const TriggerCore = require('./trigger');
const TriggerEventCore = require('./trigger_event');

class ActionCore {
  /**
   * Merge event into action context.
   */
  static addEventToContext(event, actionContext) {
    const evalContextWithEvent = Object.assign({}, actionContext.evalContext, {
      event: event || null
    });
    return Object.assign({}, actionContext, {
      evalContext: evalContextWithEvent
    });
  }

  /**
   * Get the results for a given action.
   */
  static opsForAction(action, actionContext) {
    const contextWithEvent = this.addEventToContext(action.event,
      actionContext);
    const actionClass = ActionsRegistry[action.name];
    if (!actionClass) {
      throw new Error(`Invalid action ${action.name}.`);
    }
    const paramsSpec = actionClass.params;
    const params = ActionParamCore.prepareParams(paramsSpec, action.params,
      actionContext);
    return actionClass.applyAction(params, contextWithEvent) || [];
  }

  /**
   * Just apply a simple action and return the result.
   */
  static applyActionSimple(action, actionContext) {
    var ops = this.opsForAction(action, actionContext);
    return ActionResultCore.resultFromOps(ops, actionContext);
  }

  /**
   * Apply an action, including any triggers started by a resulting events.
   */
  static applyAction(action, actionContext) {
    let result = this.applyActionSimple(action, actionContext);
    const eventOps = _.filter(result.resultOps, { operation: 'event' });
    for (const eventOp of eventOps) {
      const event = eventOp.event;
      const eventResult = this.applyEvent(event, result.nextContext);
      result = ActionResultCore.concatResult(result, eventResult);
    }
    return result;
  }

  /**
   * Trigger any triggers applied by an event.
   */
  static applyEvent(event, actionContext) {
    // Get blank result.
    let result = ActionResultCore.initialResult(actionContext);
    
    // Assemble all triggers. Include event with context because if statements
    // on the triggers may include the event context. This will filter out
    // non-repeatable triggers, or ones with failing if statements, or ones
    // in the wrong scene or page.
    const contextWithEvent = this.addEventToContext(event, actionContext);
    const nextTriggers = TriggerEventCore.triggersForEvent(event,
      contextWithEvent);

    // Apply each trigger with original context
    const actionContextWhenTriggered = actionContext;
    for (const trigger of nextTriggers) {
      const triggerResult = this.applyTrigger(
        trigger, event, result.nextContext, actionContextWhenTriggered);
      result = ActionResultCore.concatResult(result, triggerResult);
    }
    // Return concatenated results.
    return result;
  }

  /**
   * Apply a trigger, including subsequent actions.
   */
  static applyTrigger(trigger, event, actionContext,
    actionContextWhenTriggered) {
    // History op to update history in db. This is required because some
    // scripts check the history.
    const historyOps = [{
      operation: 'updateTripHistory',
      history: _.set({}, trigger.name, actionContext.evaluateAt.toISOString())
    }];
    // Create an initial result with this history update, so that subsequent
    // events can register that this was triggered.
    let result = ActionResultCore.resultFromOps(historyOps, actionContext);

    // Add event to context for consideration for if logic. Figure out which
    // actions should be called, either now or later.
    const nextActions = this.unpackedActionsForTrigger(
      trigger, event, actionContextWhenTriggered);

    // Either call or schedule each action.
    for (const action of nextActions) {
      const actionResult = this.applyOrScheduleAction(action,
        result.nextContext);
      result = ActionResultCore.concatResult(result, actionResult);
    }

    // Return all results
    return result;
  }

  /**
   * Calculate actions for a trigger and event -- include the trigger name
   * and event in the action result.
   */
  static unpackedActionsForTrigger(trigger, event, actionContext) {
    var contextWithEvent = this.addEventToContext(event, actionContext);
    return TriggerCore
      .packedActionsForTrigger(trigger, contextWithEvent)
      .map((packedAction) => {
        var unpackedAction = ActionPhraseCore.unpackAction(packedAction,
          actionContext);
        return Object.assign(unpackedAction, {
          triggerName: trigger.name,
          event: event
        });
      });
  }

  /**
   * Generate a result for a given action, either schedule it for later, or
   * apply it now.
   */
  static applyOrScheduleAction(unpackedAction, actionContext) {
    if (unpackedAction.scheduleAt.isAfter(actionContext.evaluateAt)) {
      return {
        nextContext: actionContext,
        resultOps: [],
        scheduledActions: [unpackedAction]
      };
    }
    // Otherwise apply them now, including any nested triggers!
    return this.applyAction(unpackedAction, actionContext);
  }
}

module.exports = ActionCore;
