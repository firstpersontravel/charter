function setState(script, context, params, applyAt) {
  return [{
    operation: 'updateUi',
    roleName: params.role_name,
    updates: {
      newState: params.new_value
    }
  }];
}

setState.phraseForm = ['role_name', 'new_value'];

setState.params = {
  role_name: { required: true, type: 'resource', collection: 'roles' },
  new_value: { required: true, type: 'ref' }
};

module.exports = setState;
