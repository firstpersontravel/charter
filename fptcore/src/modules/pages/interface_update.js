module.exports = {
  help: 'Set the state of an interface. For tabbed interfaces, this sets the current tab.',
  params: {
    role_name: {
      required: true,
      type: 'reference',
      collection: 'roles',
      display: { label: false },
      help: 'The role to send the new interface state to.'
    },
    new_value: {
      required: true,
      type: 'string',
      help: 'The new interface state. For tabbed interfaces, the name of the tab.'
    }
  },
  getOps(params, actionContext) {
    return [{
      operation: 'updateUi',
      roleName: params.role_name,
      updates: { newState: params.new_value }
    }];
  }
};
