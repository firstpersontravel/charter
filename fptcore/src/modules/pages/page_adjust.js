module.exports = {
  help: 'Send an ephemeral signal to a player. This is deprecated.',
  params: {
    role_name: {
      required: true,
      type: 'reference',
      collection: 'roles',
      display: { label: false },
      help: 'The role to send the adjustment to.'
    },
    new_value: {
      required: true,
      type: 'string',
      help: 'The adjustment value to send.'
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
