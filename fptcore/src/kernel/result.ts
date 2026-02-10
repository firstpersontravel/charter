const resultOpTempUpdateFunctions: Record<string, (resultOp: any, actionContext: any) => any> = {
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
    const oldHistory = actionContext.evalContext.history || {};
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
  static _tempUpdateContextForOp(resultOp: any, actionContext: any): any {
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
  static tempUpdateContext(resultOps: any[], actionContext: any): any {
    let nextContext = actionContext;
    for (const resultOp of resultOps) {
      nextContext = this._tempUpdateContextForOp(resultOp, nextContext);
    }
    return nextContext;
  }

  /**
   * Get an object representing a blank action result.
   */
  static initialResult(actionContext: any): any {
    return {
      nextContext: actionContext,
      resultOps: [],
      scheduledActions: []
    };
  }

  /**
   * Get an object representing a simple application of ops to a context.
   * Calculate waitingUntil based on any `wait` operations in the ops list.
   */
  static resultForOps(ops: any[], actionContext: any): any {
    const nextContext = this.tempUpdateContext(ops, actionContext);
    return {
      nextContext: nextContext,
      resultOps: ops,
      scheduledActions: []
    };
  }

  /**
   * Concatenate two action result objects.
   */
  static concatResult(existing: any, next: any): any {
    return {
      nextContext: next.nextContext,
      resultOps: existing.resultOps.concat(next.resultOps),
      scheduledActions: existing.scheduledActions.concat(next.scheduledActions)
    };
  }
}

module.exports = KernelResult;

export {};
