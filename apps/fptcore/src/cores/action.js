var _ = require('lodash');

var ActionParamCore = require('./action_param');
var ActionPhraseCore = require('./action_phrase');
var ActionResultCore = require('./action_result');
var ActionsRegistry = require('../registries/actions');
var TriggerCore = require('./trigger');
var TriggerEventCore = require('./trigger_event');

var ActionCore = {};

/**
 * Merge event into action context.
 */
ActionCore.addEventToContext = function(event, actionContext) {
  var evalContextWithEvent = Object.assign({}, actionContext.evalContext, {
    event: event || null
  });
  return Object.assign({}, actionContext, {
    evalContext: evalContextWithEvent
  });
};

/**
 * Get the results for a given action.
 */
ActionCore.opsForAction = function(action, actionContext) {
  var contextWithEvent = ActionCore.addEventToContext(action.event,
    actionContext);
  var actionClass = ActionsRegistry[action.name];
  if (!actionClass) {
    throw new Error('Invalid action "' + action.name + '".');
  }
  var paramsSpec = actionClass.params;
  var params = ActionParamCore.prepareParams(paramsSpec, action.params,
    actionContext);
  return actionClass.applyAction(params, contextWithEvent) || [];
};

/**
 * Get the results for a given action.
 */
ActionCore.eventForAction = function(action) {
  var actionClass = ActionsRegistry[action.name];
  if (!actionClass) {
    throw new Error('Invalid action "' + action.name + '".');
  }
  var eventFunc = actionClass.eventForParams;
  return eventFunc ? eventFunc(action.params) : null;
};

/**
 * Just apply a simple action and return the result.
 */
ActionCore.applyActionSimple = function(action, actionContext) {
  var ops = ActionCore.opsForAction(action, actionContext);
  return ActionResultCore.resultFromOps(ops, actionContext);
};

/**
 * Apply an action, including any triggers started by a resulting event.
 */
ActionCore.applyAction = function(action, actionContext) {
  var result = ActionCore.applyActionSimple(action, actionContext);
  var event = ActionCore.eventForAction(action);
  // If no event, return the simple result
  if (!event) {
    return result;
  }
  // Otherwise, calculate the concatentation of that action and the triggered
  // event.
  var eventResult = ActionCore.applyEvent(event, result.nextContext);
  return ActionResultCore.concatResult(result, eventResult);
};

/**
 * Trigger any triggers applied by an event.
 */
ActionCore.applyEvent = function(event, actionContext) {
  // Get blank result.
  var result = ActionResultCore.initialResult(actionContext);
  
  // Assemble all triggers. Include event with context because if statements
  // on the triggers may include the event context. This will filter out
  // non-repeatable triggers, or ones with failing if statements, or ones
  // in the wrong scene or page.
  var contextWithEvent = ActionCore.addEventToContext(event, actionContext);
  var nextTriggers = TriggerEventCore.triggersForEvent(event,
    contextWithEvent);

  // Apply each trigger with original context
  var actionContextWhenTriggered = actionContext;
  nextTriggers.forEach(function(trigger) {
    var triggerResult = ActionCore.applyTrigger(
      trigger, event, result.nextContext, actionContextWhenTriggered);
    result = ActionResultCore.concatResult(result, triggerResult);
  });
  // Return concatenated results.
  return result;
};

/**
 * Apply a trigger, including subsequent actions.
 */
ActionCore.applyTrigger = function(trigger, event, actionContext,
  actionContextWhenTriggered) {
  // History op to update history in db. This is required because some
  // scripts check the history.
  var historyOps = [{
    operation: 'updateTripHistory',
    history: _.set({}, trigger.name, actionContext.evaluateAt.toISOString())
  }];
  // Create an initial result with this history update, so that subsequent
  // events can register that this was triggered.
  var result = ActionResultCore.resultFromOps(historyOps, actionContext);

  // Add event to context for consideration for if logic. Figure out which
  // actions should be called, either now or later.
  var nextActions = ActionCore.unpackedActionsForTrigger(
    trigger, event, actionContextWhenTriggered);

  // Either call or schedule each action.
  nextActions.forEach(function(action) {
    var actionResult = ActionCore.applyOrScheduleAction(action,
      result.nextContext);
    result = ActionResultCore.concatResult(result, actionResult);
  });

  // Return all results
  return result;
};

/**
 * Calculate actions for a trigger and event -- include the trigger name
 * and event in the action result.
 */
ActionCore.unpackedActionsForTrigger = function(trigger, event,
  actionContext) {
  var contextWithEvent = ActionCore.addEventToContext(event, actionContext);
  return TriggerCore
    .packedActionsForTrigger(trigger, contextWithEvent)
    .map(function(packedAction) {
      var unpackedAction = ActionPhraseCore.unpackAction(packedAction,
        actionContext);
      return Object.assign(unpackedAction, {
        triggerName: trigger.name,
        event: event
      });
    });
};

/**
 * Generate a result for a given action, either schedule it for later, or
 * apply it now.
 */
ActionCore.applyOrScheduleAction = function(unpackedAction, actionContext) {
  if (unpackedAction.scheduleAt.isAfter(actionContext.evaluateAt)) {
    return {
      nextContext: actionContext,
      resultOps: [],
      scheduledActions: [unpackedAction]
    };
  }
  // Otherwise apply them now, including any nested triggers!
  return ActionCore.applyAction(unpackedAction, actionContext);
};

module.exports = ActionCore;
