const TemplateUtil = require('../../utils/template');

module.exports = {
  value_is_true: {
    help: 'Condition passes if the value has any entry that is not false.',
    properties: {
      ref: {
        type: 'lookupable',
        required: true,
        display: { label: false }
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
      ref1: { type: 'lookupable', required: true },
      ref2: { type: 'lookupable', required: true }
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
      string_ref: { type: 'lookupable', required: true },
      part_ref: { type: 'lookupable', required: true }
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
