var _ = require('lodash');

var ActionPhraseCore = require('../../cores/action_phrase');
var ActionsRegistry = require('../../registries/actions');
var EventsRegistry = require('../../registries/events');
var ParamValidators = require('../../utils/param_validators');

// TODO: don't parse the action string here -- have it be in the json
// as name/params.
var actionsClasses = _(ActionsRegistry)
  .mapValues(function(actionClass, actionName) {
    return {
      properties: {
        self: { type: 'string' }
      },
      validateResource: function(script, resource) {
        var modifierAndAction = ActionPhraseCore.extractModifier(resource);
        var plainActionPhrase = modifierAndAction[2];
        var plainAction = ActionPhraseCore.expandPlainActionPhrase(
          plainActionPhrase);
        return ParamValidators.validateParams(script, actionClass.params, plainAction.params, '');
      }
    };
  })
  .value();

var simpleActionParam = {
  type: 'variegated',
  key: function(actionPhrase) {
    var modifierAndAction = ActionPhraseCore.extractModifier(actionPhrase);
    var plainActionPhrase = modifierAndAction[2];
    var plainAction = ActionPhraseCore.expandPlainActionPhrase(
      plainActionPhrase);
    return plainAction.name;
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
    return {
      properties: _.fromPairs([[eventType, {
        type: 'object',
        properties: eventClass.specParams
      }]])
    };
  })
  .value();

var event = {
  type: 'variegated',
  key: function(obj) { return Object.keys(obj)[0]; },
  classes: eventsClasses
};

var trigger = {
  properties: {
    name: { type: 'name', required: true },
    scene: { type: 'reference', collection: 'scenes', required: true },
    events: { type: 'list', items: event, required: true },
    repeatable: { type: 'boolean', default: true },
    if: { type: 'ifClause' },
    actions: Object.assign({ required: true }, actionListParam)
  }
};

module.exports = {
  trigger: trigger
};
