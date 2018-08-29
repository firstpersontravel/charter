const assert = require('assert');

const updateProfile = require('../../src/actions/update_profile');

describe('#updateProfile', () => {
  it('sets user phone number', () => {
    const script = { content: { roles: [{ name: 'Gabe' }] } };
    const context = { Gabe: {} };
    const params = {
      role_name: 'Gabe',
      profile_key: 'phone_number',
      new_value_ref: '9144844223'
    };
    const res = updateProfile(script, context, params, null);
    assert.deepEqual(res, [{
      operation: 'updateUser',
      roleName: 'Gabe',
      updates: { phoneNumber: { $set: '9144844223' } }
    }]);
  });

  it('sets first name', () => {
    const script = { content: { roles: [{ name: 'Gabe' }] } };
    const context = { Gabe: {} };
    const params = {
      role_name: 'Gabe',
      profile_key: 'first_name',
      new_value_ref: '"Gabe"'
    };
    const res = updateProfile(script, context, params, null);
    assert.deepEqual(res, [{
      operation: 'updateUser',
      roleName: 'Gabe',
      updates: { firstName: { $set: 'Gabe' } }
    }]);
  });
});
