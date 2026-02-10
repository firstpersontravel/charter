const set_value = require('./value_set');

module.exports = {
  title: 'Increment variable',
  help: 'Increment the numerical value of a value by reference.',
  params: {
    value_ref: {
      required: true,
      type: 'simpleAttribute',
      title: 'Name',
      display: { label: false }
    },
    delta: { required: false, type: 'number' }
  },
  getOps(params: any, actionContext: any) {
    const valueRef = params.value_ref;
    const existingValue = Number(actionContext.evalContext[valueRef] || 0);
    const newValue = existingValue + (parseFloat(params.delta) || 1);
    const setValueParams = { value_ref: valueRef, new_value_ref: newValue };
    return set_value.getOps(setValueParams, actionContext);
  }
};

export {};
