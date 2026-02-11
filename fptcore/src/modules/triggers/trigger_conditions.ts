import type { ActionContext, SubIfFn } from '../../types';

module.exports = {
  and: {
    title: 'All',
    help: 'A condition that passes only if all of its subconditions pass.',
    display: { form: 'block' },
    properties: {
      items: {
        type: 'list',
        items: { type: 'component', component: 'conditions' },
        display: { label: false },
        help: 'A list of subconditions, all of which must be true.'
      }
    },
    eval: (params: Record<string, any>, actionContext: ActionContext, subIf: SubIfFn) => {
      return params.items.every(item => subIf(actionContext, item));
    }
  },
  or: {
    title: 'Any',
    help: 'A condition that passes if any one of its subconditions pass.',
    display: { form: 'block' },
    properties: {
      items: {
        type: 'list',
        items: { type: 'component', component: 'conditions' },
        display: { label: false },
        help: 'A list of subconditions, one of which must be true.'
      }
    },
    eval: (params: Record<string, any>, actionContext: ActionContext, subIf: SubIfFn) => {
      return params.items.some(item => subIf(actionContext, item));
    }
  },
  not: {
    help: 'A condition that passes if the subcondition does not pass.',
    properties: {
      item: {
        required: true,
        type: 'component',
        component: 'conditions',
        display: { label: false },
        help: 'A subcondition, which must be false.'
      }
    },
    eval: (params: Record<string, any>, actionContext: ActionContext, subIf: SubIfFn) => {
      return !params.item || !subIf(actionContext, params.item);
    }
  },
};

export {};
