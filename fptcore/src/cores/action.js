const _ = require('lodash');

const ActionResultCore = require('./action_result');
const ActionsRegistry = require('../registries/actions');
const TriggerActionCore = require('./trigger_action');
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
  static opsForImmediateAction(action, actionContext) {
    const contextWithEvent = this.addEventToContext(action.event,
      actionContext);
    const actionClass = ActionsRegistry[action.name];
    if (!actionClass) {
      throw new Error(`Invalid action ${action.name}.`);
    }
    return actionClass.getOps(action.params, contextWithEvent) || [];
  }

  /**
   * Apply an action, including any triggers started by a resulting events.
   */
  static resultForImmediateAction(action, actionContext) {
    // Apply simple action
    const actionOps = this.opsForImmediateAction(action, actionContext);
    let result = ActionResultCore.resultForOps(actionOps, actionContext);

    // Apply any events from the action.
    const eventOps = _.filter(result.resultOps, { operation: 'event' });
    for (const eventOp of eventOps) {
      const event = eventOp.event;
      const eventResult = this.resultForEvent(event, result.nextContext);
      result = ActionResultCore.concatResult(result, eventResult);
    }
    return result;
  }

  /**
   * Trigger any triggers applied by an event.
   */
  static resultForEvent(event, actionContext) {
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
      const triggerResult = this.resultForTrigger(
        trigger, event, result.nextContext, actionContextWhenTriggered);
      result = ActionResultCore.concatResult(result, triggerResult);
    }
    // Return concatenated results.
    return result;
  }

  /**
   * Apply a trigger, including subsequent actions.
   */
  static resultForTrigger(trigger, event, actionContext,
    actionContextWhenTriggered) {
    // History op to update history in db. This is required because some
    // scripts check the history.
    const historyOps = [{
      operation: 'updateTripHistory',
      history: _.set({}, trigger.name, actionContext.evaluateAt.toISOString())
    }];
    // Create an initial result with this history update, so that subsequent
    // events can register that this was triggered.
    let result = ActionResultCore.resultForOps(historyOps, actionContext);

    // Add event to context for consideration for if logic. Figure out which
    // actions should be called, either now or later.
    const contextWithEvent = this.addEventToContext(event,
      actionContextWhenTriggered);
    const nextActions = TriggerActionCore.unpackedActionsForTrigger(
      trigger, contextWithEvent);

    // Either call or schedule each action.
    for (const action of nextActions) {
      const actionResult = this.resultForFutureAction(action,
        result.nextContext);
      result = ActionResultCore.concatResult(result, actionResult);
    }

    // Return all results
    return result;
  }

  /**
   * Generate a result for a given action, either schedule it for later, or
   * apply it now.
   */
  static resultForFutureAction(unpackedAction, actionContext) {
    if (unpackedAction.scheduleAt.isAfter(actionContext.evaluateAt)) {
      return {
        nextContext: actionContext,
        resultOps: [],
        scheduledActions: [unpackedAction]
      };
    }
    // Otherwise apply them now, including any nested triggers!
    return this.resultForImmediateAction(unpackedAction, actionContext);
  }
}

module.exports = ActionCore;
