var _ = require('lodash');

var setValue = require('./set_value');

var incrementValue = {
  applyAction: function(script, context, params, applyAt) {
    var valueRef = params.value_ref;
    var existingValue = Number(_.get(context, valueRef) || 0);
    var newValue = existingValue + (parseFloat(params.delta, 10) || 1);
    var setValueParams = { value_ref: valueRef, new_value_ref: newValue };
    return setValue.applyAction(script, context, setValueParams);
  }
};

incrementValue.phraseForm = ['value_ref', 'delta'];

incrementValue.params = {
  value_ref: { required: true, type: 'ref' },
  delta: { required: false, type: 'number' }
};

module.exports = incrementValue;
