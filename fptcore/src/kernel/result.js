const resultOpTempUpdateFunctions = {
  updatePlayerFields(resultOp, actionContext) {
    const oldPlayer = actionContext.evalContext[resultOp.roleName];
    return Object.assign({}, actionContext, {
      evalContext: Object.assign({}, actionContext.evalContext, {
        [resultOp.roleName]: Object.assign({}, oldPlayer, resultOp.fields)
      })
    });
  },
  updateTripFields(resultOp, actionContext) {
    return Object.assign({}, actionContext, {
      evalContext: Object.assign({}, actionContext.evalContext,
        resultOp.fields)
    });
  },
  updateTripValues(resultOp, actionContext) {
    return Object.assign({}, actionContext, {
      evalContext: Object.assign({}, actionContext.evalContext,
        resultOp.values)
    });
  },
  updateTripHistory(resultOp, actionContext) {
    var oldHistory = actionContext.evalContext.history || {};
    return Object.assign({}, actionContext, {
      evalContext: Object.assign({}, actionContext.evalContext, {
        history: Object.assign({}, oldHistory, resultOp.history)
      })
    });
  }
};

class KernelResult {
  /**
   * Go through result ops from a given action, and update the context with the
   * results. This is a temporary stub designed to update the context in order
   * to allow processing to continue... the real update will happen after the
   * whole order processing is complete by resultOps handling.
   */
  static _tempUpdateContextForOp(resultOp, actionContext) {
    const resultOpFunc = resultOpTempUpdateFunctions[resultOp.operation];
    if (!resultOpFunc) {
      return actionContext;
    }
    return resultOpFunc(resultOp, actionContext);
  }

  /**
   * Go through result ops from a given action, and update the context with the
   * results. This is a temporary stub designed to update the context in order
   * to allow processing to continue... the real update will happen after the
   * whole order processing is complete by resultOps handling.
   */
  static tempUpdateContext(resultOps, actionContext) {
    let nextContext = actionContext;
    for (const resultOp of resultOps) {
      nextContext = this._tempUpdateContextForOp(resultOp, nextContext);
    }
    return nextContext;
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

module.exports = KernelResult;
