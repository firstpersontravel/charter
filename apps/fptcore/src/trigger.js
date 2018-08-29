var _ = require('lodash');

var ActionPhraseCore = require('./action_phrase');
var EvalCore = require('./eval');

var TriggerCore = {};

TriggerCore.activeActionPhrasesForClause = function(clause, context) {
  // If no if statement, then pick from actions.
  if (!clause.if) {
    return clause.actions;
  }
  // If .if is true, use normal actions.
  if (EvalCore.if(context, clause.if)) {
    return clause.actions;
  }
  // Check for elseifs and iterate in order.
  if (clause.elseifs) {
    for (var i = 0; i < clause.elseifs.length; i++) {
      if (EvalCore.if(context, clause.elseifs[i].if)) {
        return clause.elseifs[i].actions;
      }
    }
  }
  // No elseifs, check for else.
  if (clause.else) {
    return clause.else;
  }
  // Otherwise, return nothing.
  return [];
};

/**
 * Get executable actions for a given trigger or subclause.
 */
TriggerCore.actionPhrasesForClause = function(clause, context) {
  // Figure out which if clause is active
  var actions = TriggerCore.activeActionPhrasesForClause(clause, context);

  // Detect nothing
  if (!actions) {
    return [];
  }

  // Detect subclauses
  if (typeof actions === 'object' && actions.actions) {
    return TriggerCore.actionPhrasesForClause(actions, context);
  }

  // Detect single actions
  if (typeof actions === 'string') {
    return [actions];
  }

  // For arrays, each item is either a single action or a subclause.
  return _.flatten(actions.map(function(action) {
    // Detect subclauses
    if (typeof action === 'object' && action.actions) {
      return TriggerCore.actionPhrasesForClause(action, context);
    }
    // Otherwise it's a simple action.
    return [action];
  }));
};

/**
 * Get executable actions for a given trigger.
 */
TriggerCore.actionsForTrigger = function(trigger, context, evaluateAt) {
  var actionPhrases = TriggerCore.actionPhrasesForClause(trigger, context);
  var actions = actionPhrases
    .map(function(actionPhrase) {
      return ActionPhraseCore.expandActionPhrase(
        actionPhrase, evaluateAt, context);
    });
  return actions;
};

module.exports = TriggerCore;
