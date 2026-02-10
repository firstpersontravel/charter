
const TemplateUtil = require('../../utils/template');

module.exports = {
  title: 'Set variable',
  help: 'Update a variable in the trip state to either a constant number or string, or to match another variable by reference.',
  params: {
    value_ref: {
      required: true,
      type: 'simpleAttribute',
      title: 'Name',
      display: { label: false },
      help: 'The name of the variable to set.'
    },
    new_value_ref: {
      required: true,
      type: 'lookupable',
      title: 'To',
      help: 'The name of a variable, the value of which we want to look up and use for the value to set. Or a specific number, true, false, or text surrounded by double quotes.'
    }
  },
  getOps(params: any, actionContext: any) {
    const newValue = TemplateUtil.lookupRef(actionContext.evalContext,
      params.new_value_ref);
    return [{
      operation: 'updateTripValues',
      values: Object.fromEntries([[params.value_ref, newValue]])
    }];
  }
};

export {};
