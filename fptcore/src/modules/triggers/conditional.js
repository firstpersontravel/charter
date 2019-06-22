const actionList = {
  type: 'list',
  items: { type: 'component', component: 'actions' }
};

module.exports = {
  help: 'A conditional branch.',
  params: {
    if: { type: 'component', component: 'conditions', required: true },
    actions: actionList,
    elseifs: {
      type: 'list',
      items: {
        type: 'object',
        properties: {
          if: { type: 'component', component: 'conditions' },
          actions: actionList
        }
      }
    },
    else: actionList
  },
  // Stub, since conditionals are never executed -- instead they are
  // collapsed at trigger execute time.
  getOps(params, actionContext) {}
};
