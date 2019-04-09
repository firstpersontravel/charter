module.exports = {
  help: 'Send an ephemeral signal to a player. This is deprecated.',
  params: {
    role_name: {
      required: true,
      type: 'reference',
      collection: 'roles',
      display: { primary: true }
    },
    new_value: { required: true, type: 'string' }
  },
  applyAction: function(params, actionContext) {
    return [{
      operation: 'updateUi',
      roleName: params.role_name,
      updates: { newState: params.new_value }
    }];
  }
};
