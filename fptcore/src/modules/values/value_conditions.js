const TemplateUtil = require('../../utils/template');

var COMPARISON_OPTIONS = ['equals', 'contains', '>=', '<=', '>', '<'];

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
        params.ref, actionContext.currentRoleName);
    }
  },
  value_compare: {
    title: 'Value comparison',
    help: 'A condition that passes if the first value compares to the second in the specified way (is equal, is greater than, includes, etc.). In cases of a specific string, surround it with double quotes.',
    properties: {
      ref1: {
        title: 'Variable name 1',
        type: 'lookupable',
        required: true,
        help: 'A value to look up and compare against the second.'
      },
      comparison_method: {
        type: 'enum',
        options: COMPARISON_OPTIONS,
        default: 'equals',
        help: 'The method used to compare the first value to the second.'

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
        params.ref1, actionContext.currentRoleName);
      const val2 = TemplateUtil.lookupRef(actionContext.evalContext,
        params.ref2, actionContext.currentRoleName);
      switch(params.comparison_method) {
      case 'equals':
        if (!val1 && !val2) {
          return true;
        }
        if (!val1 || !val2) {
          return false;
        }
        return val1.toString().toLowerCase() === val2.toString().toLowerCase();
      case 'contains':
        return (
          typeof val1 === 'string' &&
          typeof val2 === 'string' &&
          val1.toLowerCase().indexOf(val2.toLowerCase()) > -1
        );
      case '>=':
        return (Number(val1) >= Number(val2));
      case '<=':
        return (Number(val1) <= Number(val2));
      case '>':
        return (Number(val1) > Number(val2));
      case '<':
        return (Number(val1) < Number(val2));
      default:
        return false;
      }
    }
  }
};
