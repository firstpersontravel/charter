const _ = require('lodash');

const ConditionCore = require('./condition');
const EventsRegistry = require('../registries/events');

class TriggerEventCore {
  /**
   * Test if a single trigger event spec is set off by an event.
   */
  static doesEventFireTriggerEvent(spec, event, actionContext) {
    // event type should equal trigger event clause
    if (spec.type !== event.type) {
      return false;
    }
    // Get matching function and calculate match.
    return EventsRegistry[event.type].matchEvent(spec, event, actionContext);
  }

  /**
   * Return the first trigger event
   */
  static triggerEventForEventType(trigger, eventType) {
    return _.find(trigger.events, { type: eventType }) || null;
  }

  /**
   * Test if a trigger is set off by an event.
   */
  static doesEventFireTrigger(trigger, event, actionContext) {
    // If no matcher for this event type, exit
    if (!EventsRegistry[event.type]) {
      return false;
    }
    const triggerEvent = this.triggerEventForEventType(trigger, event.type);

    // If trigger isn't caused by this event, skip
    if (!triggerEvent) {
      return false;
    }

    // Special case: if event is a time occurred event, treat the event
    // as non-repeatable *always*.
    const treatAsNonrepeatable = event.type === 'time_occurred';
    const hasFiredAlready = (
      actionContext.evalContext.history &&
      actionContext.evalContext.history[trigger.name]
    );
    if (treatAsNonrepeatable && hasFiredAlready) {
      return false;
    }

    return this.doesEventFireTriggerEvent(triggerEvent, event, actionContext);
  }

  /**
   * Test if a scene is active for a given context.
   */
  static isSceneActive(sceneName, actionContext) {
    const scene = _.find(actionContext.scriptContent.scenes, {
      name: sceneName
    });
    if (!scene) {
      return false;
    }

    // If we have a conditional, return false if it's not true.
    if (!ConditionCore.if(actionContext.evalContext, scene.active_if)) {
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
  }

  /**
   * Test if a trigger is active for a given context.
   */
  static isTriggerActive(trigger, actionContext) {
    // Skip triggers that don't match the current scene
    if (trigger.scene) {
      if (!this.isSceneActive(trigger.scene, actionContext)) {
        return false;
      }
    }
    // Skip inactive triggers
    if (!ConditionCore.if(actionContext.evalContext, trigger.active_if)) {
      return false;
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
  }

  /**
   * Get triggers that should be set off by a given action name and params.
   */
  static triggersForEvent(event, actionContext) {
    return _.filter(actionContext.scriptContent.triggers, (trigger) => {
      // Skip trigger if it's not active
      if (!this.isTriggerActive(trigger, actionContext)) {
        return false;
      }
      // Skip if the event doesn't match the trigger.
      if (!this.doesEventFireTrigger(trigger, event, actionContext)) {
        return false;
      }
      return true;
    });
  }
}

module.exports = TriggerEventCore;
