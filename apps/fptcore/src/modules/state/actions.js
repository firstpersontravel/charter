var set_state = {
  phraseForm: ['role_name', 'new_value'],
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

module.exports = {
  set_state: set_state
};
