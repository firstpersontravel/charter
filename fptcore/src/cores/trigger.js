var _ = require('lodash');

var EvalCore = require('./eval');

var TriggerCore = {};

/**
 * Walk the trigger actions and call the iterees for each child.
 */
TriggerCore.walkPackedActions = function(actions, path, actionIteree,
  ifIteree) {
  if (!actions) {
    return;
  }
  if (!_.isArray(actions)) {
    throw new Error('Expected actions to be an array, was ' + typeof actions +
      '.');
  }
  actions.forEach(function(action, i) {
    if (!_.isPlainObject(action)) {
      throw new Error('Expected action to be object, was ' + typeof action +
        '.');
    }
    var indexPath = path + '[' + i + ']';
    if (action.name && action.name !== 'conditional') {
      actionIteree(action, indexPath);
      return;
    }
    if (action.if) {
      ifIteree(action.if, indexPath + '.if');
    }
    if (action.actions) {
      TriggerCore.walkPackedActions(action.actions, indexPath + '.actions', 
        actionIteree, ifIteree);
    }
    if (action.elseifs) {
      action.elseifs
        .forEach(function(elseif, j) {
          var elseifPath = indexPath + '.elseifs[' + j + ']';
          ifIteree(elseif.if, elseifPath + '.if');
          TriggerCore.walkPackedActions(elseif.actions,
            elseifPath + '.actions', actionIteree, ifIteree);
        });
    }
    if (action.else) {
      TriggerCore.walkPackedActions(action.else, indexPath + '.else',
        actionIteree, ifIteree);
    }
  });
};

/**
 * Get the right set of actions for a conditional clause
 */
TriggerCore.packedActionsForConditional = function(clause, actionContext) {
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
TriggerCore.packedActionsForClause = function(clause, actionContext) {
  // Figure out which if clause is active
  var actions = TriggerCore.packedActionsForConditional(clause, actionContext);

  // Ensure an array is returned
  if (!_.isArray(actions)) {
    throw new Error('Expected actions to be an array.');
  }

  // Scan each item is and expand subclauses.
  return _.flatten(actions.map(function(action) {
    if (!_.isPlainObject(action)) {
      throw new Error('Expected action to be an object.');
    }
    // Detect conditional clauses
    if (action.name === 'conditional' || action.if) {
      return TriggerCore.packedActionsForClause(action, actionContext);
    }
    // Otherwise it's a simple action.
    return [action];
  }));
};

/**
 * Get executable actions for a given trigger.
 */
TriggerCore.packedActionsForTrigger = function(trigger, actionContext) {
  return TriggerCore.packedActionsForClause(trigger, actionContext);
};

module.exports = TriggerCore;
