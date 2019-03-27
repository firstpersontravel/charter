var _ = require('lodash');

var EvalCore = require('../../cores/eval');

module.exports = {
  help: { summary: 'Update a value in the trip state to either a constant number or string, or to match another value by reference.' },
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
      title: 'New Value'
    }
  },
  phraseForm: ['value_ref', 'new_value_ref'],
  applyAction: function(params, actionContext) {
    var newValue = EvalCore.lookupRef(actionContext.evalContext,
      params.new_value_ref);
    return [{
      operation: 'updateTripValues',
      values: _.fromPairs([[params.value_ref, newValue]])
    }];
  }
};
