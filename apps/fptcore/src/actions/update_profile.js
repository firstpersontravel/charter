var _ = require('lodash');

var EvalCore = require('../eval');

function updateProfile(script, context, params, applyAt) {
  var newValue = EvalCore.lookupRef(context, params.new_value_ref);
  return [{
    operation: 'updateUser',
    roleName: params.role_name,
    updates: _.set({}, _.camelCase(params.profile_key), { $set: newValue })
  }];
}

updateProfile.phraseForm = ['role_name', 'profile_key', 'new_value_ref'];

updateProfile.params = {
  role_name: { required: true, type: 'resource', collection: 'roles' },
  profile_key: {
    required: true,
    type: 'enum',
    values: ['phone_number', 'first_name']
  },
  new_value_ref: { required: true, type: 'ref' }
};

module.exports = updateProfile;
