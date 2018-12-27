const assert = require('assert');
const moment = require('moment');

const callActions = require('../../../src/modules/call/actions');

describe('#add_to_call', () => {
  it('starts a conference from incoming call', () => {
    const context = {
      event: {
        type: 'call_received',
        from: 'Caller'
      }
    };
    const params = { role_name: 'Invitee' };
    const res = callActions.add_to_call.applyAction(
      {}, context, params, moment.utc());
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
    const context = {};
    const params = { to_role_name: 'Callee', as_role_name: 'Actor' };
    const res = callActions.initiate_call.applyAction(
      {}, context, params, moment.utc());
    assert.deepEqual(res, [{
      operation: 'initiateCall',
      toRoleName: 'Callee',
      asRoleName: 'Actor',
      detectVoicemail: false
    }]);
  });
});
