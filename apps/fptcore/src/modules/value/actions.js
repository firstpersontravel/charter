var _ = require('lodash');

var EvalCore = require('../../cores/eval');

var set_value = {
  params: {
    value_ref: { required: true, type: 'ref' },
    new_value_ref: { required: true, type: 'ref' }
  },
  phraseForm: ['value_ref', 'new_value_ref'],
  applyAction: function(script, context, params, applyAt) {
    var newValue = EvalCore.lookupRef(context, params.new_value_ref);
    return [{
      operation: 'updateTripValues',
      values: _.fromPairs([[params.value_ref, newValue]])
    }];
  }
};

var increment_value = {
  params: {
    value_ref: { required: true, type: 'ref' },
    delta: { required: false, type: 'number' }
  },
  phraseForm: ['value_ref', 'delta'],
  applyAction: function(script, context, params, applyAt) {
    var valueRef = params.value_ref;
    var existingValue = Number(_.get(context, valueRef) || 0);
    var newValue = existingValue + (parseFloat(params.delta, 10) || 1);
    var setValueParams = { value_ref: valueRef, new_value_ref: newValue };
    return set_value.applyAction(script, context, setValueParams);
  }
};

module.exports = {
  set_value: set_value,
  increment_value: increment_value
};
