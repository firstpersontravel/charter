const TemplateUtil = require('../../utils/template');

const COMPARISON_FUNCTIONS = {
  '<': function(a, b) { return a < b; },
  '<=': function(a, b) { return a <= b; },
  '==': function(a, b) { return a == b; },
  '>=': function(a, b) { return a >= b; },
  '>': function(a, b) { return a > b; }
};

module.exports = {
  value_is_true: {
    title: 'Variable is present',
    help: 'A condition that passes if the variable has any value that is not false.',
    properties: {
      ref: {
        type: 'lookupable',
        title: 'Variable name',
        required: true,
        display: { label: false },
        help: 'A value to look up and see if it contains any non-false value.'
      }
    },
    eval: (params, actionContext) => {
      return !!TemplateUtil.lookupRef(actionContext.evalContext,
        params.ref, actionContext.triggeringRoleName);
    }
  },
  value_equals: {
    title: 'Variables are equal',
    help: 'A condition that passes if the first value matches the second value. If "Value 1" or "Value 2" are surrounded by double quotes, or are a number, or "true" or "false", then the value in the other reference will be matched to that simple value rather performing two lookups.',
    properties: {
      ref1: {
        title: 'Variable name 1',
        type: 'lookupable',
        required: true,
        help: 'A value to look up and compare against the second.'
      },
      ref2: {
        type: 'lookupable',
        title: 'Variable name 2',
        required: true,
        help: 'Another value to look up and compare against the first. In cases of a specific string, surround it with double quotes.'
      }
    },
    eval: (params, actionContext) => {
      const val1 = TemplateUtil.lookupRef(actionContext.evalContext,
        params.ref1, actionContext.triggeringRoleName);
      const val2 = TemplateUtil.lookupRef(actionContext.evalContext,
        params.ref2, actionContext.triggeringRoleName);
      if (!val1 && !val2) {
        return true;
      }
      return (val1 || '').toString().toLowerCase() === (val2 || '').toString().toLowerCase();
    }
  },
  value_contains: {
    title: 'Variable contains',
    help: 'A condition that passes if the search variable value contains the part in the part variable. If \'string_ref\' or \'part_ref\' are surrounded by double quotes, or are a number, or "true" or "false", then the value in the other reference will be matched to that simple variable rather performing two lookups.',
    properties: {
      string_ref: {
        title: 'Search variable name',
        type: 'lookupable',
        required: true,
        help: 'A variable to look up, which should contain text. In cases of a specific string, surround it with double quotes.'
      },
      part_ref: {
        type: 'lookupable',
        title: 'Part variable name',
        required: true,
        help: 'A variable to look up which should contain the fragment to check for. In cases of a specific string, surround it with double quotes.'
      }
    },
    eval: (params, actionContext) => {
      const a = TemplateUtil.lookupRef(actionContext.evalContext,
        params.string_ref, actionContext.triggeringRoleName);
      const b = TemplateUtil.lookupRef(actionContext.evalContext,
        params.part_ref, actionContext.triggeringRoleName);
      return (
        typeof a === 'string' &&
        typeof b === 'string' &&
        a.toLowerCase().indexOf(b.toLowerCase()) > -1
      );
    }
  },

  value_compare: {
    title: 'Value comparison',
    help: 'A condition that passes if the first value numerically compares to the second in the specified way.',
    properties: {
      ref1: {
        title: 'Variable name or number 1',
        type: 'lookupable',
        required: true,
        help: 'A numeric value to look up and compare against the second.'
      },
      comparator: {
        type: 'enum',
        options: Object.keys(COMPARISON_FUNCTIONS),
        default: '>=',
        help: 'The method used to compare the first value to the second.'
      },
      ref2: {
        type: 'lookupable',
        title: 'Variable name or number 2',
        required: true,
        help: 'Another numeric value to look up and compare against the first.'
      }
    },
    eval: (params, actionContext) => {
      const num1 = Number(TemplateUtil.lookupRef(actionContext.evalContext,
        params.ref1, actionContext.currentRoleName));
      const num2 = Number(TemplateUtil.lookupRef(actionContext.evalContext,
        params.ref2, actionContext.currentRoleName));

      const ref1AsNumber = Number.isNaN(num1) ? 0: num1;
      const ref2AsNumber = Number.isNaN(num2) ? 0: num2;

      return(COMPARISON_FUNCTIONS[params.comparator](ref1AsNumber, ref2AsNumber));
    }
  }
};
