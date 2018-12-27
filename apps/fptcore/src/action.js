var _ = require('lodash');

var ActionParamCore = require('./action_param');
var ActionResultCore = require('./action_result');
var ActionValidationCore = require('./action_validation');
var TriggerCore = require('./trigger');
var TriggerEventCore = require('./trigger_event');

var ActionCore = {};

/**
 * Merge event into action context.
 */
ActionCore.addEventToContext = function(context, event) {
  return Object.assign({}, context, { event: event || null });
};

/**
 * Get the results for a given action.
 */
ActionCore.opsForAction = function(script, context, action, applyAt) {
  var contextWithEvent = ActionCore.addEventToContext(context, action.event);
  ActionValidationCore.validateActionAtRun(script, contextWithEvent, action);
  var actionClass = ActionValidationCore.getAction(action.name);
  var paramsSpec = actionClass.params;
  var params = ActionParamCore.prepareParams(script, context, paramsSpec,
    action.params);
  var actionFunc = actionClass.applyAction;
  return actionFunc(script, contextWithEvent, params, applyAt) || [];
};

/**
 * Get the results for a given action.
 */
ActionCore.eventForAction = function(action) {
  var actionClass = ActionValidationCore.getAction(action.name);
  if (!actionClass) {
    throw new Error('Invalid action "' + action.name + '".');
  }
  var eventFunc = actionClass.eventForParams;
  return eventFunc ? eventFunc(action.params) : null;
};

/**
 * Just apply a simple action and return the result.
 */
ActionCore.applyActionSimple = function(script, context, action, applyAt) {
  var ops = ActionCore.opsForAction(script, context, action, applyAt);
  return ActionResultCore.resultFromContextAndOps(context, ops);
};

/**
 * Apply an action, including any triggers started by a resulting event.
 */
ActionCore.applyAction = function(script, context, action, applyAt) {
  var result = ActionCore.applyActionSimple(script, context, action, applyAt);
  var event = ActionCore.eventForAction(action);
  // If no event, return the simple result
  if (!event) {
    return result;
  }
  // Otherwise, calculate the concatentation of that action and the triggered
  // event.
  var eventResult = ActionCore.applyEvent(script, result.nextContext, event,
    applyAt);
  return ActionResultCore.concatResult(result, eventResult);
};

/**
 * Trigger any triggers applied by an event.
 */
ActionCore.applyEvent = function(script, context, event, applyAt) {
  // Get blank result.
  var result = ActionResultCore.initialResult(context);
  
  // Assemble all triggers. Include event with context because if statements
  // on the triggers may include the event context. This will filter out
  // non-repeatable triggers, or ones with failing if statements, or ones
  // in the wrong scene or page.
  var contextWithEvent = ActionCore.addEventToContext(context, event);
  var nextTriggers = TriggerEventCore
    .triggersForEvent(script, contextWithEvent, event);

  // Apply each trigger with original context
  var triggerContext = context;
  nextTriggers.forEach(function(trigger) {
    var triggerResult = ActionCore.applyTrigger(script,
      triggerContext, result.nextContext, trigger, event, applyAt);
    result = ActionResultCore.concatResult(result, triggerResult);
  });
  // Return concatenated results.
  return result;
};

/**
 * Apply a trigger, including subsequent actions.
 */
ActionCore.applyTrigger = function(script, triggerContext, currentContext,
  trigger, event, applyAt) {
  // History op to update history in db. This is required because some
  // scripts check the history.
  var historyOps = [{
    operation: 'updateTrip',
    updates: {
      history: _.fromPairs([[trigger.name, { $set: applyAt.toISOString() }]])
    }
  }];
  // Create an initial result with this history update, so that subsequent
  // events can register that this was triggered.
  var result = ActionResultCore.resultFromContextAndOps(
    currentContext, historyOps);

  // Add event to context for consideration for if logic. Figure out which
  // actions should be called, either now or later.
  var nextActions = ActionCore.actionsForTriggerAndEvent(
    trigger, triggerContext, event, applyAt);

  // Either call or schedule each action.
  nextActions.forEach(function(action) {
    var actionResult = ActionCore.applyOrScheduleAction(
      script, result.nextContext, action, applyAt);
    result = ActionResultCore.concatResult(result, actionResult);
  });

  // Return all results
  return result;
};

/**
 * Calculate actions for a trigger and event -- include the trigger name
 * and event in the action result.
 */
ActionCore.actionsForTriggerAndEvent = function(trigger, context, event,
  applyAt) {
  var contextWithEvent = ActionCore.addEventToContext(context, event);
  return TriggerCore
    .actionsForTrigger(trigger, contextWithEvent, applyAt)
    .map(function(action) {
      return Object.assign(action, {
        triggerName: trigger.name,
        event: event
      });
    });
};

/**
 * Generate a result for a given action, either schedule it for later, or
 * apply it now.
 */
ActionCore.applyOrScheduleAction = function(script, context, action, applyAt) {
  // Schedule actions if they have a later time.
  if (action.scheduleAt.isAfter(applyAt)) {
    // Validate first to ensure it's ok.
    ActionValidationCore.validateActionAtRun(script, context, action);
    // If it is, allow it to be scheduled.
    return {
      nextContext: context,
      resultOps: [],
      scheduledActions: [action]
    };
  }
  // Otherwise apply them now, including any nested triggers!
  return ActionCore.applyAction(script, context, action, applyAt);
};

module.exports = ActionCore;
