const assert = require('assert');

const callActions = require('../../../src/modules/call/actions');

describe('#add_to_call', () => {
  it('starts a conference from incoming call', () => {
    const params = { role_name: 'Invitee' };
    const actionContext = {
      evalContext: {
        event: { type: 'call_received', from: 'Caller' }
      }
    };

    const res = callActions.add_to_call.applyAction(params, actionContext);

    assert.deepEqual(res, [
      {
        operation: 'twiml',
        clause: 'dial',
        fromRoleName: 'Caller',
        toRoleName: 'Invitee'
      }
    ]);
  });
});

describe('#initiate_call', () => {
  it('starts a conference from incoming call', () => {
    const params = { to_role_name: 'Callee', as_role_name: 'Actor' };
    const actionContext = { evalContext: {} };

    const res = callActions.initiate_call.applyAction(params, actionContext);

    assert.deepEqual(res, [{
      operation: 'initiateCall',
      toRoleName: 'Callee',
      asRoleName: 'Actor',
      detectVoicemail: false
    }]);
  });
});
