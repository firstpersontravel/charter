const _ = require('lodash');

module.exports = {
  and: {
    help: 'Condition passes only if all the subconditions pass.',
    display: { form: 'block' },
    properties: {
      items: {
        type: 'list',
        items: { type: 'component', component: 'conditions' },
        display: { label: false }
      }
    },
    eval: (params, actionContext, subIf) => {
      return _.every(params.items, item => subIf(actionContext, item));
    }
  },
  or: {
    help: 'Condition passes if any of the subconditions pass.',
    display: { form: 'block' },
    properties: {
      items: {
        type: 'list',
        items: { type: 'component', component: 'conditions' },
        display: { label: false }
      }
    },
    eval: (params, actionContext, subIf) => {
      return _.some(params.items, item => subIf(actionContext, item));
    }
  },
  not: {
    help: 'Condition passes if the subcondition does not pass.',
    properties: {
      item: {
        required: true,
        type: 'component',
        component: 'conditions',
        display: { label: false }
      }
    },
    eval: (params, actionContext, subIf) => {
      return !params.item || !subIf(actionContext, params.item);
    }
  },
};
