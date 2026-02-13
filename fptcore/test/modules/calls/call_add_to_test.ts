const assert = require('assert');

const add_to_call = require('../../../src/modules/calls/call_add_to').default;

describe('#add_to_call', () => {
  it('starts a conference from incoming call', () => {
    const params = { role_name: 'Invitee' };
    const actionContext = {
      evalContext: {
        event: { type: 'call_received', from: 'Caller' }
      }
    };

    const res = add_to_call.getOps(params, actionContext);

    assert.deepEqual(res, [{
      operation: 'twiml',
      clause: 'dial',
      fromRoleName: 'Caller',
      toRoleName: 'Invitee'
    }]);
  });
});
