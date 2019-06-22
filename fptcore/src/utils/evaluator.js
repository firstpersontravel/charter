class Evaluator {
  constructor(registry) {
    this.registry = registry;
  }

  if(evalContext, ifStatement) {
    // Null if statements resolve to true.
    if (!ifStatement) {
      return true;
    }
    // Call eval statement on individual condition class.
    const ifClass = this.registry.conditions[ifStatement.op];
    if (!ifClass) {
      throw new Error(`Invalid if operation: "${ifStatement.op}": should be one of: ${Object.keys(this.registry.conditions).join(', ')}.`);
    }
    // Recursively pass in a reference to `this.if` so compound if statements
    // can call it back.
    return ifClass.eval(ifStatement, evalContext, this.if.bind(this));
  }
}

module.exports = Evaluator;
