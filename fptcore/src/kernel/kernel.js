const moment = require('moment');

const ActionsRegistry = require('../registries/actions');
const KernelResult = require('./result');
const KernelActions = require('./actions');
const KernelTriggers = require('./triggers');

class Kernel {
  /**
   * Merge event into action context.
   */
  static addEventToContext(event, actionContext) {
    return Object.assign({}, actionContext, {
      evalContext: Object.assign({}, actionContext.evalContext, {
        event: event || null
      })
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
    let result = KernelResult.resultForOps(actionOps, actionContext);

    // Apply any events from the action.
    const eventOps = result.resultOps.filter(op => op.operation === 'event');
    for (const eventOp of eventOps) {
      const event = eventOp.event;
      const eventResult = this.resultForEvent(event, result.nextContext);
      result = KernelResult.concatResult(result, eventResult);
    }
    return result;
  }

  /**
   * Trigger any triggers applied by an event.
   */
  static resultForEvent(event, actionContext) {
    // Get blank result.
    let result = KernelResult.initialResult(actionContext);
    
    // Assemble all triggers. Include event with context because if statements
    // on the triggers may include the event context. This will filter out
    // non-repeatable triggers, or ones with failing if statements, or ones
    // in the wrong scene or page.
    const contextWithEvent = this.addEventToContext(event, actionContext);
    const nextTriggers = KernelTriggers.triggersForEvent(event,
      contextWithEvent);

    // Apply each trigger with original context
    const actionContextWhenTriggered = actionContext;
    for (const trigger of nextTriggers) {
      const triggerResult = this.resultForTrigger(
        trigger, event, result.nextContext, actionContextWhenTriggered);
      result = KernelResult.concatResult(result, triggerResult);
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
      history: { [trigger.name]: actionContext.evaluateAt.toISOString() }
    }];
    // Create an initial result with this history update, so that subsequent
    // events can register that this was triggered.
    let result = KernelResult.resultForOps(historyOps, actionContext);

    // Add event to context for consideration for if logic. Figure out which
    // actions should be called, either now or later.
    const contextWithEvent = this.addEventToContext(event,
      actionContextWhenTriggered);
    const nextActions = KernelActions.unpackedActionsForTrigger(
      trigger, contextWithEvent);

    // Either call or schedule each action.
    for (const action of nextActions) {
      const actionResult = this.resultForTriggeredAction(action,
        result.nextContext);
      result = KernelResult.concatResult(result, actionResult);
    }

    // Return all results
    return result;
  }

  /**
   * Generate a result for a given action, either schedule it for later, or
   * apply it now.
   */
  static resultForTriggeredAction(unpackedAction, actionContext) {
    // If it's to be scheduled later, just add it to the schedule.
    const evaluateAt = actionContext.evaluateAt;
    const waitingUntil = actionContext.waitingUntil;
    const scheduleAt = waitingUntil ?
      moment.max(waitingUntil, unpackedAction.scheduleAt) :
      unpackedAction.scheduleAt;
    const scheduleForFuture = scheduleAt.isAfter(evaluateAt);
    if (scheduleForFuture) {
      return {
        nextContext: actionContext,
        waitingUntil: null,
        resultOps: [],
        scheduledActions: [unpackedAction]
      };
    }
    // Otherwise apply them now, including any nested triggers.
    return this.resultForImmediateAction(unpackedAction, actionContext);
  }
}

module.exports = Kernel;
