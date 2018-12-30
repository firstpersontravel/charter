var _ = require('lodash');

var EvalCore = require('../../cores/eval');

var set_value = {
  params: {
    value_ref: { required: true, type: 'simpleAttribute' },
    new_value_ref: { required: true, type: 'lookupable' }
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
  params: {
    value_ref: { required: true, type: 'simpleAttribute' },
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
