const _ = require('lodash');

const KernelActions = require('../kernel/actions');

function createActionListProperty(actionsRegistry) {
  // Filled in later to avoid circular dependency
  const actionListParam = {};

  const actionsClasses = _.mapValues(actionsRegistry, actionClass => ({
    properties: actionClass.params
  }));

  const elseIfParam = {
    type: 'object',
    properties: {
      if: { type: 'ifClause' },
      actions: actionListParam
    }
  };

  actionsClasses.conditional = {
    properties: {
      name: {
        type: 'enum',
        options: Object.keys(actionsClasses),
        required: true,
        display: { label: false, placeholder: 'Action' }
      },
      if: { type: 'ifClause', required: true },
      actions: actionListParam,
      elseifs: { type: 'list', items: elseIfParam },
      else: actionListParam
    }
  };

  const actionParam = {
    type: 'component',
    key: 'name',
    common: {
      display: { form: 'inline' },
      properties: {
        name: {
          display: { label: false, placeholder: 'Action' },
          type: 'enum',
          options: Object.keys(actionsClasses),
          required: true
        }
      }
    },
    classes: actionsClasses
  };

  // Filled in now to avoid a circular dependency
  Object.assign(actionListParam, {
    type: 'list',
    default: [{}],
    items: actionParam
  });

  return actionListParam;
}

function createEventResource(eventsRegistry) {
  const eventsClasses = _(eventsRegistry)
    .mapValues(function(eventClass, eventType) {
      return { properties: eventClass.specParams };
    })
    .value();

  return {
    type: 'component',
    key: 'type',
    common: {
      display: { form: 'inline' },
      properties: {
        type: {
          display: { label: false },
          type: 'enum',
          options: Object.keys(eventsRegistry),
          required: true
        }
      }
    },
    classes: eventsClasses
  };
}

module.exports = function (actionsRegistry, eventsRegistry) {
  function validateActionWithTrigger(action, path, trigger) {
    const warnings = [];
    const actionClass = actionsRegistry[action.name];
    if (!actionClass) {
      return;
    }
    // Check against required event types if present.
    if (actionClass.requiredEventTypes) {
      if (!_.includes(actionClass.requiredEventTypes, trigger.event.type)) {
        warnings.push('Action "' + path + '" ("' + action.name + '") is triggered by event "' + trigger.event.type +
          '", but requires one of: ' +
          actionClass.requiredEventTypes.join(', ') + '.');
      }
    }
    return warnings;
  }

  function getEventParent(trigger, eventSpec) {
    // Special case; the `scene_started` event is always
    if (eventSpec.type === 'scene_started') {
      return `scenes.${trigger.scene}`;
    }
    const eventClass = eventsRegistry[eventSpec.type];
    if (!eventClass) {
      throw new Error(`Invalid event ${eventSpec.type}.`);
    }
    if (!eventClass.parentParamNameOnEventSpec) {
      return null;
    }
    const paramSpec = eventClass.specParams[eventClass.parentParamNameOnEventSpec];
    if (paramSpec.type !== 'reference') {
      return null;
    }
    const collectionName = paramSpec.collection;
    const resourceName = eventSpec[eventClass.parentParamNameOnEventSpec];
    return collectionName + '.' + resourceName;
  }

  return {
    icon: 'certificate',
    help: 'A fires when a defined event occurs. Once fired, it will apply a set of actions, which change the trip state.',
    properties: {
      name: { type: 'name', required: true },
      scene: { type: 'reference', collection: 'scenes', required: true },
      event: createEventResource(eventsRegistry),
      repeatable: { type: 'boolean', default: true },
      active_if: { type: 'ifClause' },
      actions: createActionListProperty(actionsRegistry)
    },
    validateResource: function(script, resource) {
      // Iterate over actions and ifs to provide trigger-specific validation that
      // can't be provided by looking at the script and action in and of itself.
      const warnings = [];

      // Iterator for actions.
      const actionIteree = function(action, path) {
        warnings.push.apply(warnings, validateActionWithTrigger(action, path,
          resource));
      };

      const ifIteree = function(ifClause, path) {};
      
      KernelActions.walkActions(resource.actions, 'actions',
        actionIteree, ifIteree);
      return warnings;
    },
    getTitle: function(scriptContent, resource) {
      const eventClass = eventsRegistry[resource.event.type];
      if (!eventClass) {
        return 'No event';
      }
      if (eventClass.getTitle) {
        const customTitle = eventClass.getTitle(scriptContent, resource.event);
        if (customTitle) {
          return customTitle;
        }
      }
      return resource.event.type.replace(/_/g, ' ');
    },
    getParentClaims: function(resource) {
      const parent = getEventParent(resource, resource.event);
      return parent ? [parent] : [];
    },
    getChildClaims: function(resource) {
      const childClaims = [];
      KernelActions.walkActions(resource.actions, '',
        function(action, path) {
          const actionClass = actionsRegistry[action.name];
          if (actionClass.getChildClaims) {
            const actionChildClaims = actionClass.getChildClaims(action);
            childClaims.push.apply(childClaims, actionChildClaims);
          }
        },
        function() {}
      );
      return childClaims;
    }
  };
};
