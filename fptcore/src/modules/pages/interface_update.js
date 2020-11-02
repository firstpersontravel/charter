module.exports = {
  title: 'Focus tab',
  help: 'Bring up a specific tab on an interface.',
  params: {
    role_name: {
      required: true,
      type: 'reference',
      collection: 'roles',
      display: { label: false },
      help: 'The role to apply the change to.'
    },
    new_value: {
      required: true,
      type: 'string',
      help: 'The title of the tab to focus.'
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
