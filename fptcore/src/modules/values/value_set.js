const _ = require('lodash');

const TemplateUtil = require('../../utils/template');

module.exports = {
  title: 'Set variable',
  help: 'Update a variable in the trip state to either a constant number or string, or to match another variable by reference.',
  params: {
    value_ref: {
      required: true,
      type: 'simpleAttribute',
      title: 'Name',
      display: { label: false }
    },
    new_value_ref: {
      required: true,
      type: 'lookupable',
      title: 'To'
    }
  },
  getOps(params, actionContext) {
    const newValue = TemplateUtil.lookupRef(actionContext.evalContext,
      params.new_value_ref);
    return [{
      operation: 'updateTripValues',
      values: _.fromPairs([[params.value_ref, newValue]])
    }];
  }
};
