const TemplateUtil = require('../../utils/template');

module.exports = {
  istrue: {
    properties: {
      ref: {
        type: 'lookupable',
        required: true,
        display: { label: false }
      }
    },
    eval: function(params, evalContext) {
      return !!TemplateUtil.lookupRef(evalContext, params.ref);
    }
  },
  equals: {
    properties: {
      ref1: { type: 'lookupable', required: true },
      ref2: { type: 'lookupable', required: true }
    },
    eval: function(params, evalContext) {
      return (
        TemplateUtil.lookupRef(evalContext, params.ref1) ===
        TemplateUtil.lookupRef(evalContext, params.ref2)
      );
    }
  },
  contains: {
    properties: {
      string_ref: { type: 'lookupable', required: true },
      part_ref: { type: 'lookupable', required: true }
    },
    eval: function(params, evalContext) {
      const a = TemplateUtil.lookupRef(evalContext, params.string_ref);
      const b = TemplateUtil.lookupRef(evalContext, params.part_ref);
      return (
        typeof a === 'string' &&
        typeof b === 'string' &&
        a.toLowerCase().indexOf(b.toLowerCase()) > -1
      );
    }
  }
};
