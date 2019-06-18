const moment = require('moment');

const ActionsRegistry = require('../registries/actions');
const KernelResult = require('./result');
const KernelActions = require('./actions');
const KernelTriggers = require('./triggers');

class Kernel {
  static getActionClass(name) {
    return ActionsRegistry[name];
  }

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
    const actionClass = this.getActionClass(action.name);
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
    let latestResult = KernelResult.resultForOps(actionOps, actionContext);

    // Apply any events from the action.
    const evts = latestResult.resultOps.filter(op => op.operation === 'event');
    for (const eventOp of evts) {
      const event = eventOp.event;
      const eventResult = this.resultForEvent(event, latestResult.nextContext);
      latestResult = KernelResult.concatResult(latestResult, eventResult);
    }
    return latestResult;
  }

  /**
   * Trigger any triggers applied by an event.
   */
  static resultForEvent(event, actionContext) {
    // Get blank result.
    let latestResult = KernelResult.initialResult(actionContext);
    
    // Assemble all triggers. Include event with context because if statements
    // on the triggers may include the event context. This will filter out
    // non-repeatable triggers, or ones with failing if statements, or ones
    // in the wrong scene or page.
    const contextWithEvent = this.addEventToContext(event, actionContext);
    const nextTriggers = KernelTriggers.triggersForEvent(event,
      contextWithEvent);

    // Apply each trigger with original context
    for (const trigger of nextTriggers) {
      const triggerResult = this.resultForTrigger(trigger, event,
        latestResult.nextContext, actionContext);
      latestResult = KernelResult.concatResult(latestResult, triggerResult);
    }
    // Return concatenated results.
    return latestResult;
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
    let latestResult = KernelResult.resultForOps(historyOps, actionContext);

    // Add event to context for consideration for if logic. Figure out which
    // actions should be called, either now or later.
    const contextWithEvent = this.addEventToContext(event,
      actionContextWhenTriggered);
    const nextActions = KernelActions.unpackedActionsForTrigger(
      trigger, contextWithEvent);

    // Either call or schedule each action.
    let waitingUntil = actionContext.evaluateAt;
    for (const unpackedAction of nextActions) {
      // Get results immediately -- to test if this is a wait or not.
      const actionResult = this.resultForImmediateAction(unpackedAction,
        latestResult.nextContext);

      // If we have waits, increment the waitingUntil counter.
      const waits = actionResult.resultOps.filter(o => o.operation === 'wait');
      if (waits.length > 0) {
        waits.forEach(op => {
          const opUntil = op.until ?
            op.until :
            waitingUntil.clone().add(op.seconds, 'seconds');
          waitingUntil = moment.max(opUntil, waitingUntil);
        });
        // Then continue -- no waits + other actions are allowed since ops
        // can't be scheduled, only actions.
        continue;
      }

      // If we reach here, the command did not have any wait statements.
      // So we either want to apply it if we're not yet waiting, or schedule
      // it, either if we are, or if the command had an internal wait from
      // `time` or `offset` properties -- to be deprecated.
      const scheduleAt = moment.max(waitingUntil, unpackedAction.scheduleAt);
      // If it's later, schedule it
      if (scheduleAt.isAfter(actionContext.evaluateAt)) {
        latestResult.scheduledActions.push(Object.assign({}, unpackedAction, {
          scheduleAt: scheduleAt
        }));
        continue;
      }

      // If it's to be scheduled now, apply immediately.
      latestResult = KernelResult.concatResult(latestResult, actionResult);
    }

    // Return all results
    return latestResult;
  }
}

module.exports = Kernel;
