const _ = require('lodash');

module.exports = {
  and: {
    properties: {
      items: {
        type: 'list',
        items: { type: 'component', component: 'conditions' },
        display: { label: false }
      }
    },
    eval: (params, evalContext, subIf) => {
      return _.every(params.items, item => subIf(evalContext, item));
    }
  },
  or: {
    properties: {
      items: {
        type: 'list',
        items: { type: 'component', component: 'conditions' },
        display: { label: false }
      }
    },
    eval: (params, evalContext, subIf) => {
      return _.some(params.items, item => subIf(evalContext, item));
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
    eval: (params, evalContext, subIf) => {
      return !params.item || !subIf(evalContext, params.item);
    }
  },
};
