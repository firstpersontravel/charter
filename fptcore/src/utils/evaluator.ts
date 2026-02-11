import type { Registry, ActionContext, ComponentValue } from '../types';

class Evaluator {
  registry: Registry;

  constructor(registry: Registry) {
    this.registry = registry;
  }

  if(actionContext: ActionContext, ifStatement: ComponentValue): boolean {
    // Null if statements resolve to true.
    if (!ifStatement) {
      return true;
    }
    // Call eval statement on individual condition class.
    const ifClass = this.registry.conditions[ifStatement.op as string];
    if (!ifClass) {
      throw new Error(`Invalid if operation: "${ifStatement.op}": should be one of: ${Object.keys(this.registry.conditions).join(', ')}.`);
    }
    // Recursively pass in a reference to `this.if` so compound if statements
    // can call it back.
    return ifClass.eval(ifStatement, actionContext, this.if.bind(this));
  }
}

module.exports = Evaluator;

export {};
