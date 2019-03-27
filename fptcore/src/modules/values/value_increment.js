var set_value = require('./value_set');

module.exports = {
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
