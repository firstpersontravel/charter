var _ = require('lodash');

var ActionResultCore = {};

/**
 * Go through result ops from a given action, and update the context with the
 * results. This is a temporary stub designed to update the context in order
 * to allow processing to continue... the real update will happen after the
 * whole order processing is complete by resultOps handling.
 */
ActionResultCore._tempApplyResultOp = function(context, resultOp) {
  switch (resultOp.operation) {
  case 'updatePlayerFields': {
    var oldPlayer = context[resultOp.roleName];
    var player = Object.assign({}, oldPlayer, resultOp.fields);
    return Object.assign({}, context, _.set({}, resultOp.roleName, player));
  }
  case 'updateTripFields': {
    return Object.assign({}, context, resultOp.fields);
  }
  case 'updateTripValues': {
    return Object.assign({}, context, resultOp.values);
  }
  case 'updateTripHistory': {
    var oldHistory = context.history || {};
    var history = Object.assign({}, oldHistory, resultOp.history);
    return Object.assign({}, context, { history: history });
  }
  }
  return context;
};

/**
 * Go through result ops from a given action, and update the context with the
 * results. This is a temporary stub designed to update the context in order
 * to allow processing to continue... the real update will happen after the
 * whole order processing is complete by resultOps handling.
 */
ActionResultCore.tempUpdateContext = function(context, resultOps) {
  resultOps.forEach(function(resultOp) {
    context = ActionResultCore._tempApplyResultOp(context, resultOp);
  });
  return context;
};

/**
 * Get an object representing a blank action result.
 */
ActionResultCore.initialResult = function(context) {
  return { nextContext: context, resultOps: [], scheduledActions: [] };
};

/**
 * Get an object representing a simple application of ops to a context
 */
ActionResultCore.resultFromContextAndOps = function(context, ops) {
  var nextContext = ActionResultCore.tempUpdateContext(context, ops);
  return {
    nextContext: nextContext,
    resultOps: ops,
    scheduledActions: []
  };
};

/**
 * Concatenate two action result objects.
 */
ActionResultCore.concatResult = function(existing, nextResult) {
  return {
    nextContext: nextResult.nextContext,
    resultOps: existing.resultOps.concat(nextResult.resultOps),
    scheduledActions: existing.scheduledActions
      .concat(nextResult.scheduledActions)
  };
};

module.exports = ActionResultCore;
