var _ = require('lodash');

var setValue = require('./set_value');

function incrementValue(script, context, params, applyAt) {
  var existingValue = Number(_.get(context, params.value_ref) || 0);
  var newValue = existingValue + (parseFloat(params.delta, 10) || 1);
  return setValue(script, context, {
    value_ref: params.value_ref,
    new_value_ref: newValue
  });
}

incrementValue.phraseForm = ['value_ref', 'delta'];

incrementValue.params = {
  value_ref: { required: true, type: 'ref' },
  delta: { required: false, type: 'number' }
};

module.exports = incrementValue;
