var _ = require('lodash');

var EvalCore = require('./eval');
var Events = require('./events');

var TriggerEventCore = {};

/**
 * Test if a single trigger event spec is set off by an event.
 */
TriggerEventCore.doesEventFireTriggerEvent = function(
  script, context, triggerEvent, event
) {
  // event type should equal trigger event clause
  if (!triggerEvent[event.type]) {
    return false;
  }
  // Get matching function and calculate match.
  var spec = triggerEvent[event.type];
  return Events[event.type].matchEvent(script, context, spec, event);
};

/**
 * Return the first trigger event
 */
TriggerEventCore.triggerEventForEventType = function(trigger, eventType) {
  var triggerEvents = _.isArray(trigger.event) ?
    trigger.event : [trigger.event];
  return _.find(triggerEvents, function(triggerEvent) {
    return !!triggerEvent[eventType];
  }) || null;
};

/**
 * Test if a trigger is set off by an event.
 */
TriggerEventCore.doesEventFireTrigger = function(
  script, context, trigger, event
) {
  // If no matcher for this event type, exit
  if (!Events[event.type]) {
    return false;
  }
  var triggerEvent = TriggerEventCore.triggerEventForEventType(
    trigger, event.type);
  if (!triggerEvent) {
    return false;
  }
  return TriggerEventCore.doesEventFireTriggerEvent(
    script, context, triggerEvent, event);
};

/**
 * Test if a trigger is active for a given context.
 */
TriggerEventCore.isTriggerActive = function(script, context, trigger) {
  // Skip triggers that don't match the current scene
  if (trigger.scene) {
    if (context.currentSceneName !== trigger.scene) {
      return false;
    }
  }
  // Skip triggers that don't match current page
  if (trigger.page) {
    var page = _.find(script.content.pages || [], { name: trigger.page });
    if (!context[page.role]) {
      return false;
    }
    if (context[page.role].currentPageName !== trigger.page) {
      return false;
    }
  }
  // Skip inactive triggers
  if (trigger.if) {
    if (!EvalCore.if(context, trigger.if)) {
      return false;
    }
  }
  // Skip non-repeatable triggers that have already fired.
  if (trigger.repeatable === false) {
    if (context.history && context.history[trigger.name]) {
      return false;
    }
  }
  // Otherwise we're active.
  return true;
};

/**
 * Get triggers that should be set off by a given action name and params.
 */
TriggerEventCore.triggersForEvent = function(script, context, event) {
  return _.filter(script.content.triggers, function(trigger) {
    // Skip trigger if it's not active
    if (!TriggerEventCore.isTriggerActive(script, context, trigger)) {
      return false;
    }
    // Skip if the event doesn't match the trigger.
    if (!TriggerEventCore.doesEventFireTrigger(script, context, trigger, event)) {
      return false;
    }
    return true;
  });
};

module.exports = TriggerEventCore;
