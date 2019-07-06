const TemplateUtil = require('../../utils/template');

module.exports = {
  value_is_true: {
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
