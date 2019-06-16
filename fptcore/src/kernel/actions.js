const _ = require('lodash');
const moment = require('moment-timezone');

const ConditionCore = require('../cores/condition');
const TimeUtil = require('../utils/time');

class KernelActions {
  /**
   * Walk the trigger actions and call the iterees for each child.
   */
  static walkPackedActions(actions, path, actionIteree, ifIteree) {
    if (!actions) {
      return;
    }
    if (!_.isArray(actions)) {
      throw new Error('Expected actions to be an array, was ' + typeof actions +
        '.');
    }
    actions.forEach((action, i) => {
      if (!_.isPlainObject(action)) {
        throw new Error('Expected action to be object, was ' + typeof action +
          '.');
      }
      const indexPath = path + '[' + i + ']';
      if (action.name && action.name !== 'conditional') {
        actionIteree(action, indexPath);
        return;
      }
      if (action.if) {
        ifIteree(action.if, indexPath + '.if');
      }
      if (action.actions) {
        this.walkPackedActions(action.actions, indexPath + '.actions', 
          actionIteree, ifIteree);
      }
      if (action.elseifs) {
        action.elseifs.forEach((elseif, j) => {
          const elseifPath = indexPath + '.elseifs[' + j + ']';
          ifIteree(elseif.if, elseifPath + '.if');
          this.walkPackedActions(elseif.actions, elseifPath + '.actions', 
            actionIteree, ifIteree);
        });
      }
      if (action.else) {
        this.walkPackedActions(action.else, indexPath + '.else',
          actionIteree, ifIteree);
      }
    });
  }

  /**
   * Get the right set of actions for a conditional clause
   */
  static packedActionsForConditional(clause, actionContext) {
    // If no if statement, then pick from actions.
    if (!clause.if) {
      return clause.actions;
    }
    // If .if is true, use normal actions.
    if (ConditionCore.if(actionContext.evalContext, clause.if)) {
      return clause.actions;
    }
    // Check for elseifs and iterate in order.
    if (clause.elseifs) {
      for (let i = 0; i < clause.elseifs.length; i++) {
        if (ConditionCore.if(actionContext.evalContext, clause.elseifs[i].if)) {
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
  }

  /**
   * Get executable actions for a given trigger or subclause.
   */
  static packedActionsForClause(clause, actionContext) {
    // Figure out which if clause is active
    const actions = this.packedActionsForConditional(clause, actionContext);

    // Ensure an array is returned
    if (!_.isArray(actions)) {
      throw new Error('Expected actions to be an array.');
    }

    // Scan each item is and expand subclauses.
    return _.flatten(actions.map((action) => {
      if (!_.isPlainObject(action)) {
        throw new Error('Expected action to be an object.');
      }
      // Detect conditional clauses
      if (action.name === 'conditional' || action.if) {
        return this.packedActionsForClause(action, actionContext);
      }
      // Otherwise it's a simple action.
      return [action];
    }));
  }

  /**
   * Get executable actions for a given trigger.
   */
  static packedActionsForTrigger(trigger, actionContext) {
    return this.packedActionsForClause(trigger, actionContext);
  }

  /**
   * Parse an action when modifier ("in 3m") into a time.
   */
  static unpackAction(action, actionContext) {
    const params = _.omit(action, 'name', 'when', 'offset');
    const baseTimestamp = action.when ?
      actionContext.evalContext.schedule[action.when] :
      actionContext.evaluateAt;
    const offsetSecs = TimeUtil.secondsForOffsetShorthand(action.offset);
    const scheduleAt = moment
      .utc(baseTimestamp)
      .add(offsetSecs, 'seconds');
    return {
      name: action.name,
      params: params,
      scheduleAt: scheduleAt
    };
  }

  /**
   * Calculate actions for a trigger and event -- include the trigger name
   * and event in the action result.
   */
  static unpackedActionsForTrigger(trigger, actionContext) {
    const packedActions = this.packedActionsForTrigger(trigger, actionContext);
    return packedActions.map((packedAction) => {
      const unpackedAction = this.unpackAction(packedAction, actionContext);
      return Object.assign(unpackedAction, {
        triggerName: trigger.name,
        event: actionContext.evalContext.event
      });
    });
  }
}

module.exports = KernelActions;
