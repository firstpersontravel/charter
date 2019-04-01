var _ = require('lodash');

var TriggerCore = require('../cores/trigger');

function createActionListProperty(actionsRegistry) {
  var actionsClasses = _.mapValues(actionsRegistry, function(actionClass) {
    return { properties: actionClass.params };
  });

  var ACTION_NAME_OPTIONS = Object.keys(actionsRegistry).concat(['conditional']);

  var singleActionParam = {
    type: 'variegated',
    key: 'name',
    common: {
      display: { form: 'inline' },
      properties: {
        name: {
          display: { primary: true, placeholder: 'Action' },
          type: 'enum',
          options: ACTION_NAME_OPTIONS,
          required: true
        },
        when: {
          type: 'reference',
          collection: 'times',
          display: { last: true, placeholder: 'At once' }
        },
        offset: {
          type: 'timeOffset',
          display: { last: true, placeholder: 'None' }
        }
      }
    },
    classes: actionsClasses
  };

  var singleActionResource = {
    properties: { self: singleActionParam }
  };

  // Filled in later to avoid circular dependency
  var actionListParam = {};

  var elseIfParam = {
    type: 'object',
    properties: {
      if: { type: 'ifClause' },
      actions: actionListParam
    }
  };

  var conditionalActionResource = {
    properties: {
      name: {
        type: 'enum',
        options: ACTION_NAME_OPTIONS,
        required: true,
        display: { primary: true, placeholder: 'Action' }
      },
      if: { type: 'ifClause', required: true },
      actions: actionListParam,
      elseifs: { type: 'list', items: elseIfParam },
      else: actionListParam
    }
  };

  var actionOrClauseParam = {
    type: 'variegated',
    key: function(obj) {
      return obj.name === 'conditional' ? 'conditionalAction' : 'singleAction';
    },
    classes: {
      singleAction: singleActionResource,
      conditionalAction: conditionalActionResource
    }
  };

  // Filled in now to avoid a circular dependency
  Object.assign(actionListParam, {
    type: 'list',
    default: [{}],
    items: actionOrClauseParam
  });

  return actionListParam;
}

function createEventResource(eventsRegistry) {
  var eventsClasses = _(eventsRegistry)
    .mapValues(function(eventClass, eventType) {
      return { properties: eventClass.specParams };
    })
    .value();

  return {
    type: 'variegated',
    key: 'type',
    common: {
      display: { form: 'inline' },
      properties: {
        type: {
          display: { primary: true },
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
    var warnings = [];
    var actionClass = actionsRegistry[action.name];
    if (!actionClass) {
      return;
    }
    // Check against required event types if present.
    if (actionClass.requiredEventTypes) {
      var resourceEventTypes = _.uniq(_.map(trigger.events, 'type'));
      resourceEventTypes.forEach(function(resourceEventType) {
        if (!_.includes(actionClass.requiredEventTypes, resourceEventType)) {
          warnings.push('Action "' + path + '" ("' + action.name + '") is triggered by event "' + resourceEventType +
            '", but requires one of: ' +
            actionClass.requiredEventTypes.join(', ') + '.');
        }
      });
    }
    return warnings;
  }

  function getEventParent(eventSpec) {
    var eventClass = eventsRegistry[eventSpec.type];
    if (!eventClass.parentResourceParam) {
      return null;
    }
    var paramSpec = eventClass.specParams[eventClass.parentResourceParam];
    if (paramSpec.type !== 'reference') {
      return null;
    }
    var collectionName = paramSpec.collection;
    var resourceName = eventSpec[eventClass.parentResourceParam];
    return collectionName + '.' + resourceName;
  }

  return {
    icon: 'certificate',
    help: {
      summary: 'A trigger is the primary method for creating interactivity. Each trigger fires upon certain events. Once fired, it will apply a set of actions, which change the trip state.'
    },
    properties: {
      name: { type: 'name', required: true },
      scene: { type: 'reference', collection: 'scenes', required: true },
      events: {
        type: 'list',
        items: createEventResource(eventsRegistry),
        required: true,
        default: [{}]
      },
      repeatable: { type: 'boolean', default: true },
      if: { type: 'ifClause' },
      actions: createActionListProperty(actionsRegistry)
    },
    validateResource: function(script, resource) {
      // Iterate over actions and ifs to provide trigger-specific validation that
      // can't be provided by looking at the script and action in and of itself.
      var warnings = [];

      // Iterator for actions.
      var actionIteree = function(action, path) {
        warnings.push.apply(warnings, validateActionWithTrigger(action, path,
          resource));
      };

      var ifIteree = function(ifClause, path) {

      };
      TriggerCore.walkPackedActions(resource.actions, 'actions', actionIteree,
        ifIteree);
      return warnings;
    },
    getTitle: function(scriptContent, resource) {
      if (!resource.events.length) {
        return 'Untriggerable';
      }
      var firstEvent = resource.events[0];
      var firstEventClass = eventsRegistry[firstEvent.type];
      if (firstEventClass.getTitle) {
        var customTitle = firstEventClass.getTitle(scriptContent, firstEvent);
        if (customTitle) {
          return customTitle;
        }
      }
      return firstEvent.type.replace(/_/g, ' ');
    },
    getParentClaims: function(resource) {
      return _(resource.events)
        .map(getEventParent)
        .filter(Boolean)
        .value();
    },
    getChildClaims: function(resource) {
      var childClaims = [];
      TriggerCore.walkPackedActions(resource.actions, '',
        function(action, path) {
          var actionClass = actionsRegistry[action.name];
          if (actionClass.getChildClaims) {
            var actionChildClaims = actionClass.getChildClaims(action);
            childClaims.push.apply(childClaims, actionChildClaims);
          }
        },
        function() {}
      );
      return childClaims;
    }
  };
};
