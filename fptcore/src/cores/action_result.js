var _ = require('lodash');

class ActionResultCore {
  /**
   * Go through result ops from a given action, and update the context with the
   * results. This is a temporary stub designed to update the context in order
   * to allow processing to continue... the real update will happen after the
   * whole order processing is complete by resultOps handling.
   */
  static _tempApplyResultOp(resultOp, evalContext) {
    switch (resultOp.operation) {
    case 'updatePlayerFields': {
      var oldPlayer = evalContext[resultOp.roleName];
      var player = Object.assign({}, oldPlayer, resultOp.fields);
      return Object.assign({}, evalContext, _.set({}, resultOp.roleName, player));
    }
    case 'updateTripFields': {
      return Object.assign({}, evalContext, resultOp.fields);
    }
    case 'updateTripValues': {
      return Object.assign({}, evalContext, resultOp.values);
    }
    case 'updateTripHistory': {
      var oldHistory = evalContext.history || {};
      var history = Object.assign({}, oldHistory, resultOp.history);
      return Object.assign({}, evalContext, { history: history });
    }
    }
    return evalContext;
  }

  /**
   * Go through result ops from a given action, and update the context with the
   * results. This is a temporary stub designed to update the context in order
   * to allow processing to continue... the real update will happen after the
   * whole order processing is complete by resultOps handling.
   */
  static tempUpdateContext(resultOps, actionContext) {
    var nextEvalContext = actionContext.evalContext;
    for (const resultOp of resultOps) {
      nextEvalContext = this._tempApplyResultOp(resultOp, nextEvalContext);
    }
    return Object.assign({}, actionContext, { evalContext: nextEvalContext });
  }

  /**
   * Get an object representing a blank action result.
   */
  static initialResult(actionContext) {
    return {
      nextContext: actionContext,
      resultOps: [],
      scheduledActions: []
    };
  }

  /**
   * Get an object representing a simple application of ops to a context
   */
  static resultForOps(ops, actionContext) {
    var nextContext = this.tempUpdateContext(ops, actionContext);
    return {
      nextContext: nextContext,
      resultOps: ops,
      scheduledActions: []
    };
  }

  /**
   * Concatenate two action result objects.
   */
  static concatResult(existing, nextResult) {
    return {
      nextContext: nextResult.nextContext,
      resultOps: existing.resultOps.concat(nextResult.resultOps),
      scheduledActions: existing.scheduledActions
        .concat(nextResult.scheduledActions)
    };
  }
}

module.exports = ActionResultCore;
