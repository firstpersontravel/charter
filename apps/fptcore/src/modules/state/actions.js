var set_state = {
  phraseForm: ['role_name', 'new_value'],
  params: {
    role_name: { required: true, type: 'reference', collection: 'roles' },
    new_value: { required: true, type: 'valueName' }
  },
  applyAction: function(script, context, params, applyAt) {
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
