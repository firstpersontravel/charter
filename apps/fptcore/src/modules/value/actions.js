var _ = require('lodash');

var EvalCore = require('../../cores/eval');

var set_value = {
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

var increment_value = {
  help: { summary: 'Increment the numerical value of a value by reference.' },
  params: {
    value_ref: {
      required: true,
      type: 'simpleAttribute',
      title: 'Name',
      display: { primary: true }
    },
    delta: { required: false, type: 'number' }
  },
  phraseForm: ['value_ref', 'delta'],
  applyAction: function(params, actionContext) {
    var valueRef = params.value_ref;
    var existingValue = Number(actionContext.evalContext[valueRef] || 0);
    var newValue = existingValue + (parseFloat(params.delta, 10) || 1);
    var setValueParams = { value_ref: valueRef, new_value_ref: newValue };
    return set_value.applyAction(setValueParams, actionContext);
  }
};

module.exports = {
  set_value: set_value,
  increment_value: increment_value
};
