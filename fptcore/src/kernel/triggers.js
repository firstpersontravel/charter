const _ = require('lodash');

const Evaluator = require('../utils/evaluator');
const Registry = require('../registry/registry');

const evaluator = new Evaluator(Registry);

class KernelTriggers {
  /**
   * Test if a single trigger event spec is set off by an event.
   */
  static doesEventFireTriggerEvent(spec, event, actionContext) {
    // event type should equal trigger event clause
    if (spec.type !== event.type) {
      return false;
    }
    // Get matching function and calculate match.
    return Registry.events[event.type].matchEvent(spec, event, actionContext);
  }

  /**
   * Test if a trigger is set off by an event.
   */
  static doesEventFireTrigger(trigger, event, actionContext) {
    // If no matcher for this event type, exit
    if (!Registry.events[event.type]) {
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

    return this.doesEventFireTriggerEvent(trigger.event, event, actionContext);
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
    if (!evaluator.if(actionContext, scene.active_if)) {
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
    if (!evaluator.if(actionContext, trigger.active_if)) {
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

module.exports = KernelTriggers;
