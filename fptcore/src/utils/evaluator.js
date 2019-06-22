const _ = require('lodash');

class Evaluator {
  constructor(registry) {
    const compoundIfOpClasses = {
      and: {
        properties: {
          items: {
            type: 'list',
            items: { type: 'ifClause' },
            display: { label: false }
          }
        },
        eval: (params, evalContext) => {
          return _.every(params.items, item => this.if(evalContext, item));
        }
      },
      or: {
        properties: {
          items: {
            type: 'list',
            items: { type: 'ifClause' },
            display: { label: false }
          }
        },
        eval: (params, evalContext) => {
          return _.some(params.items, item => this.if(evalContext, item));
        }
      },
      not: {
        properties: {
          item: {
            required: true,
            type: 'ifClause',
            display: { label: false }
          }
        },
        eval: (params, evalContext) => {
          return !params.item || !this.if(evalContext, params.item);
        }
      },
    };
    this.ifOpClasses = Object.assign({}, compoundIfOpClasses,
      registry.conditions);

    this.ifSpec = {
      type: 'component',
      key: 'op',
      common: {
        properties: {
          op: {
            type: 'enum',
            options: Object.keys(this.ifOpClasses),
            required: true,
            display: { label: false }
          }
        }
      },
      classes: this.ifOpClasses
    };
  }

  if(evalContext, ifStatement) {
    // Null if statements resolve to true.
    if (!ifStatement) {
      return true;
    }
    const ifClass = this.ifOpClasses[ifStatement.op];
    if (!ifClass) {
      throw new Error(`Invalid if operation: "${ifStatement.op}": should be one of: ${Object.keys(this.ifOpClasses).join(', ')}.`);
    }
    return ifClass.eval(ifStatement, evalContext);
  }
}

module.exports = Evaluator;
