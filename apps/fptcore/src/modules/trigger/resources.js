var _ = require('lodash');

var ActionPhraseCore = require('../../cores/action_phrase');
var ActionsRegistry = require('../../registries/actions');
var EventsRegistry = require('../../registries/events');
var ParamValidators = require('../../utils/param_validators');
var TriggerCore = require('../../cores/trigger');

// TODO: don't parse the action string here -- have it be in the json
// as name/params.
var actionsClasses = _(ActionsRegistry)
  .mapValues(function(actionClass, actionName) {
    return {
      properties: {
        self: { type: 'actionPhrase' }
      },
      validateResource: function(script, resource) {
        var action = ActionPhraseCore.parseActionPhrase(resource);
        return ParamValidators.validateParams(script, actionClass.params, action.params, '');
      }
    };
  })
  .value();

var simpleActionParam = {
  type: 'variegated',
  key: function(actionPhrase) {
    var action = ActionPhraseCore.parseActionPhrase(actionPhrase);
    return action.name;
  },
  classes: actionsClasses
};

var simpleActionResource = { properties: { self: simpleActionParam } };

// Filled in later to avoid circular dependency
var actionListParam = {};

var elseIfParam = {
  type: 'object',
  properties: {
    if: { type: 'ifClause' },
    actions: actionListParam
  }
};

var actionClauseResource = {
  properties: {
    if: { type: 'ifClause' },
    actions: actionListParam,
    elseifs: { type: 'list', items: elseIfParam },
    else: actionListParam
  }
};

var actionOrClauseParam = {
  type: 'variegated',
  key: function(obj) {
    return _.isString(obj) ? 'simpleAction' : 'actionClause';
  },
  classes: {
    simpleAction: simpleActionResource,
    actionClause: actionClauseResource
  }
};

// Filled in now to avoid a circular dependency
Object.assign(actionListParam, { type: 'list', items: actionOrClauseParam });

var eventsClasses = _(EventsRegistry)
  .mapValues(function(eventClass, eventType) {
    return { properties: eventClass.specParams };
  })
  .value();

var eventResource = {
  type: 'variegated',
  key: 'type',
  common: { properties: { type: { type: 'string', required: true } } },
  classes: eventsClasses
};

function validateActionWithTrigger(actionPhrase, path, trigger) {
  var warnings = [];
  var action = ActionPhraseCore.parseActionPhrase(actionPhrase);
  var actionClass = ActionsRegistry[action.name];
  if (!actionClass) {
    return;
  }
  // Check against required event types if present.
  if (actionClass.requiredEventTypes) {
    var resourceEventTypes = _.uniq(_.map(trigger.events, 'type'));
    resourceEventTypes.forEach(function(resourceEventType) {
      if (!_.includes(actionClass.requiredEventTypes, resourceEventType)) {
        warnings.push('Action "' + path + '" ("' + actionPhrase + '") is triggered by event "' + resourceEventType +
          '", but requires one of: ' +
          actionClass.requiredEventTypes.join(', ') + '.');
      }
    });
  }
  return warnings;
}

var trigger = {
  title: function(resource) {
    if (!resource.events.length) {
      return 'Untriggerable';
    }
    var firstEvent = resource.events[0];
    var firstEventClass = EventsRegistry[firstEvent.type];
    if (firstEventClass.title) {
      return 'On ' + firstEventClass.title(firstEvent);
    }
    return 'On ' + firstEvent.type.replace(/_/g, ' ');
  },
  properties: {
    name: { type: 'name', required: true },
    scene: { type: 'reference', collection: 'scenes', required: true },
    events: { type: 'list', items: eventResource, required: true },
    repeatable: { type: 'boolean', default: true },
    if: { type: 'ifClause' },
    actions: Object.assign({ required: true }, actionListParam)
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
    TriggerCore.walkActions(resource.actions, 'actions', actionIteree,
      ifIteree);
    return warnings;
  }
};

module.exports = {
  trigger: trigger
};
