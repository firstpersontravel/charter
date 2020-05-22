const TemplateUtil = require('../../utils/template');

module.exports = {
  value_is_true: {
    help: 'Condition passes if the value has any entry that is not false.',
    properties: {
      ref: {
        type: 'lookupable',
        title: 'Value',
        required: true,
        display: { label: false },
        help: 'A value to look up and see if it contains any non-false value.'
      }
    },
    eval: (params, actionContext) => {
      return !!TemplateUtil.lookupRef(actionContext.evalContext,
        params.ref);
    }
  },
  value_equals: {
    help: 'Condition passes if the value in \'ref1\' matches the value in \'ref2\'. If \'ref1\' or \'ref2\' are surrounded by double quotes, or are a number, or "true" or "false", then the value in the other reference will be matched to that simple value rather performing two lookups.',
    properties: {
      ref1: {
        title: 'Value 1',
        type: 'lookupable',
        required: true,
        help: 'A value to look up and compare against the second.'
      },
      ref2: {
        type: 'lookupable',
        title: 'Value 2',
        required: true,
        help: 'Another value to look up and compare against the first. In cases of a specific string, surround it with double quotes.'
      }
    },
    eval: (params, actionContext) => {
      return (
        TemplateUtil.lookupRef(actionContext.evalContext, params.ref1) ===
        TemplateUtil.lookupRef(actionContext.evalContext, params.ref2)
      );
    }
  },
  value_contains: {
    help: 'Condition passes if the value in \'string_ref\' contains the part in \'part_ref\'. If \'string_ref\' or \'part_ref\' are surrounded by double quotes, or are a number, or "true" or "false", then the value in the other reference will be matched to that simple value rather performing two lookups.',
    properties: {
      string_ref: {
        title: 'Search',
        type: 'lookupable',
        required: true,
        help: 'A value to look up, which should contain text. In cases of a specific string, surround it with double quotes.'
      },
      part_ref: {
        type: 'lookupable',
        title: 'For',
        required: true,
        help: 'A value to look up which should contain the fragment to check for. In cases of a specific string, surround it with double quotes.'
      }
    },
    eval: (params, actionContext) => {
      const a = TemplateUtil.lookupRef(actionContext.evalContext,
        params.string_ref);
      const b = TemplateUtil.lookupRef(actionContext.evalContext,
        params.part_ref);
      return (
        typeof a === 'string' &&
        typeof b === 'string' &&
        a.toLowerCase().indexOf(b.toLowerCase()) > -1
      );
    }
  }
};
