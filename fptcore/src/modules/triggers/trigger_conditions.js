const _ = require('lodash');

module.exports = {
  and: {
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
