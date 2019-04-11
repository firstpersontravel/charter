const _ = require('lodash');

const TemplateUtil = require('../../utils/template');

module.exports = {
  help: 'Update a value in the trip state to either a constant number or string, or to match another value by reference.',
  params: {
    value_ref: {
      required: true,
      type: 'simpleAttribute',
      title: 'Name',
      display: { primary: true }
    },
    new_value_ref: {
      required: true,
      type: 'lookupable',
      title: 'To'
    }
  },
  applyAction: function(params, actionContext) {
    const newValue = TemplateUtil.lookupRef(actionContext.evalContext,
      params.new_value_ref);
    return [{
      operation: 'updateTripValues',
      values: _.fromPairs([[params.value_ref, newValue]])
    }];
  }
};
