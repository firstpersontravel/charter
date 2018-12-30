var _ = require('lodash');

var EvalCore = require('./eval');
var EventsRegistry = require('../registries/events');

var TriggerEventCore = {};

/**
 * Test if a single trigger event spec is set off by an event.
 */
TriggerEventCore.doesEventFireTriggerEvent = function(
  triggerEvent, event, actionContext
) {
  // event type should equal trigger event clause
  if (!triggerEvent[event.type]) {
    return false;
  }
  // Get matching function and calculate match.
  var spec = triggerEvent[event.type];
  return EventsRegistry[event.type].matchEvent(spec, event, actionContext);
};

/**
 * Return the first trigger event
 */
TriggerEventCore.triggerEventForEventType = function(trigger, eventType) {
  return _.find(trigger.events, function(triggerEvent) {
    return !!triggerEvent[eventType];
  }) || null;
};

/**
 * Test if a trigger is set off by an event.
 */
TriggerEventCore.doesEventFireTrigger = function(trigger, event,
  actionContext) {
  // If no matcher for this event type, exit
  if (!EventsRegistry[event.type]) {
    return false;
  }
  var triggerEvent = TriggerEventCore.triggerEventForEventType(
    trigger, event.type);
  if (!triggerEvent) {
    return false;
  }
  return TriggerEventCore.doesEventFireTriggerEvent(
    triggerEvent, event, actionContext);
};

/**
 * Test if a scene is active for a given context.
 */
TriggerEventCore.isSceneActive = function(sceneName, actionContext) {
  var scene = _.find(actionContext.scriptContent.scenes, { name: sceneName });
  if (!scene) {
    return false;
  }

  // If we have a conditional, return false if it's not true.
  if (scene.if && !EvalCore.if(actionContext.evalContext, scene.if)) {
    return false;
  }

  // If it's global, and we've passed the conditional check, then it's active.
  if (scene.global) {
    return true;
  }

  // If it's not a global scene, then check if it's current.
  if (actionContext.evalContext.currentSceneName === sceneName) {
    return true;
  }

  // If we're not global or current, we're not active.
  return false;
};

/**
 * Test if a trigger is active for a given context.
 */
TriggerEventCore.isTriggerActive = function(trigger, actionContext) {
  // Skip triggers that don't match the current scene
  if (trigger.scene) {
    if (!TriggerEventCore.isSceneActive(trigger.scene, actionContext)) {
      return false;
    }
  }
  // Skip inactive triggers
  if (trigger.if) {
    if (!EvalCore.if(actionContext.evalContext, trigger.if)) {
      return false;
    }
  }
  // Skip non-repeatable triggers that have already fired.
  if (trigger.repeatable === false) {
    if (actionContext.evalContext.history &&
        actionContext.evalContext.history[trigger.name]) {
      return false;
    }
  }
  // Otherwise we're active.
  return true;
};

/**
 * Get triggers that should be set off by a given action name and params.
 */
TriggerEventCore.triggersForEvent = function(event, actionContext) {
  return _.filter(actionContext.scriptContent.triggers, function(trigger) {
    // Skip trigger if it's not active
    if (!TriggerEventCore.isTriggerActive(trigger, actionContext)) {
      return false;
    }
    // Skip if the event doesn't match the trigger.
    if (!TriggerEventCore.doesEventFireTrigger(
      trigger, event, actionContext)) {
      return false;
    }
    return true;
  });
};

module.exports = TriggerEventCore;
