const assert = require('assert');

const initiate_call = require('../../../src/modules/calls/call_initiate');

describe('#initiate_call', () => {
  it('starts a conference from incoming call', () => {
    const params = { to_role_name: 'Callee', as_role_name: 'Actor' };
    const actionContext = { evalContext: {} };

    const res = initiate_call.applyAction(params, actionContext);

    assert.deepEqual(res, [{
      operation: 'initiateCall',
      toRoleName: 'Callee',
      asRoleName: 'Actor',
      detectVoicemail: false
    }]);
  });
});
