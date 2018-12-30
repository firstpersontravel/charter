var _ = require('lodash');

var ActionPhraseCore = require('./action_phrase');
var EvalCore = require('./eval');

var TriggerCore = {};

/**
 * Walk the trigger actions and call the iterees for each child.
 */
TriggerCore.walkActions = function(actions, path, actionIteree, ifIteree) {
  if (!actions) {
    return;
  }
  actions.forEach(function(action, i) {
    var indexPath = path + '[' + i + ']';
    if (_.isString(action)) {
      actionIteree(action, indexPath);
      return;
    }
    if (_.isPlainObject(action)) {
      if (action.if) {
        ifIteree(action.if, indexPath + '.if');
      }
      TriggerCore.walkActions(action.actions, indexPath + '.actions', 
        actionIteree, ifIteree);
      (action.elseifs || []).forEach(function(elseif, j) {
        var elseifPath = indexPath + '.elseifs[' + j + ']';
        ifIteree(elseif.if, elseifPath + '.if');
        TriggerCore.walkActions(elseif.actions, elseifPath + '.actions',
          actionIteree, ifIteree);
      });
      TriggerCore.walkActions(action.else, indexPath + '.else', actionIteree,
        ifIteree);
    }
  });
};

TriggerCore.activeActionPhrasesForClause = function(clause, actionContext) {
  // If no if statement, then pick from actions.
  if (!clause.if) {
    return clause.actions;
  }
  // If .if is true, use normal actions.
  if (EvalCore.if(actionContext.evalContext, clause.if)) {
    return clause.actions;
  }
  // Check for elseifs and iterate in order.
  if (clause.elseifs) {
    for (var i = 0; i < clause.elseifs.length; i++) {
      if (EvalCore.if(actionContext.evalContext, clause.elseifs[i].if)) {
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
TriggerCore.actionPhrasesForClause = function(clause, actionContext) {
  // Figure out which if clause is active
  var actions = TriggerCore.activeActionPhrasesForClause(clause,
    actionContext);

  // Detect nothing
  if (!actions) {
    return [];
  }

  // Detect subclauses
  if (typeof actions === 'object' && actions.actions) {
    return TriggerCore.actionPhrasesForClause(actions, actionContext);
  }

  // Detect single actions
  if (typeof actions === 'string') {
    return [actions];
  }

  // For arrays, each item is either a single action or a subclause.
  return _.flatten(actions.map(function(action) {
    // Detect subclauses
    if (typeof action === 'object' && action.actions) {
      return TriggerCore.actionPhrasesForClause(action, actionContext);
    }
    // Otherwise it's a simple action.
    return [action];
  }));
};

/**
 * Get executable actions for a given trigger.
 */
TriggerCore.actionsForTrigger = function(trigger, actionContext) {
  var actionPhrases = TriggerCore.actionPhrasesForClause(
    trigger, actionContext);

  var actions = actionPhrases
    .map(function(actionPhrase) {
      return ActionPhraseCore.expandActionPhrase(actionPhrase, actionContext);
    });
  return actions;
};

module.exports = TriggerCore;
