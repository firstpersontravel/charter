const coreRegistry = require('../core-registry');
const Evaluator = require('../utils/evaluator');
import { isPlainObject } from '../utils/lodash-replacements';
import type { ActionContext, TriggerAction, ScriptTrigger } from '../types';

const evaluator = new Evaluator(coreRegistry);

class KernelActions {
  /**
   * Walk the trigger actions and call the iterees for each child.
   */
  static walkActions(actions: TriggerAction[], path: string, actionIteree: (action: TriggerAction, path: string) => void, ifIteree: (condition: unknown, path: string) => void): void {
    if (!actions) {
      return;
    }
    if (!Array.isArray(actions)) {
      throw new Error(`Expected actions to be array, was ${typeof actions}.`);
    }
    for (const [i, action] of Object.entries(actions)) {
      if (!isPlainObject(action)) {
        throw new Error(`Expected action to be object, was ${typeof action}.`);
      }
      const indexPath = path + '[' + i + ']';
      if (action.name && action.name !== 'conditional') {
        actionIteree(action, indexPath);
        continue;
      }
      if (action.if) {
        ifIteree(action.if, indexPath + '.if');
      }
      if (action.actions) {
        this.walkActions(action.actions, indexPath + '.actions',
          actionIteree, ifIteree);
      }
      if (action.elseifs) {
        for (const [j, elseif] of Object.entries(action.elseifs)) {
          const elseifPath = indexPath + '.elseifs[' + j + ']';
          ifIteree(elseif.if, elseifPath + '.if');
          this.walkActions(elseif.actions, elseifPath + '.actions',
            actionIteree, ifIteree);
        }
      }
      if (action.else) {
        this.walkActions(action.else, indexPath + '.else',
          actionIteree, ifIteree);
      }
    }
  }

  /**
   * Get the right set of actions for a conditional clause
   */
  static actionsForConditional(clause: TriggerAction | ScriptTrigger, actionContext: ActionContext): TriggerAction[] {
    // If no if statement, then pick from actions.
    if (!clause.if) {
      return clause.actions || [];
    }
    // If .if is true, use normal actions.
    if (evaluator.if(actionContext, clause.if)) {
      return clause.actions || [];
    }
    // Check for elseifs and iterate in order.
    if (clause.elseifs) {
      for (const elseif of clause.elseifs) {
        if (evaluator.if(actionContext, elseif.if)) {
          return elseif.actions;
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
  static actionsForClause(clause: TriggerAction | ScriptTrigger, actionContext: ActionContext): TriggerAction[] {
    // Figure out which if clause is active
    const actions = this.actionsForConditional(clause, actionContext);

    if (!actions) {
      return [];
    }

    // Ensure an array is returned
    if (!Array.isArray(actions)) {
      throw new Error('Expected actions to be an array.');
    }

    // Scan each item is and expand subclauses.
    return actions.map((action: TriggerAction) => {
      if (!isPlainObject(action)) {
        throw new Error('Expected action to be an object.');
      }
      // Detect conditional clauses
      if (action.name === 'conditional' || action.if) {
        return this.actionsForClause(action, actionContext);
      }
      // Otherwise it's a simple action.
      return [action];
    }).flat();
  }

  /**
   * Get executable actions for a given trigger.
   */
  static actionsForTrigger(trigger: ScriptTrigger, actionContext: ActionContext): TriggerAction[] {
    return this.actionsForClause(trigger, actionContext);
  }
}

module.exports = KernelActions;
