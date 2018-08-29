const assert = require('assert');
const moment = require('moment');

const addToCall = require('../../../src/actions/call/add_to_call');

describe('#addToCall', () => {

  it('starts a conference from incoming call', () => {
    const context = {
      event: {
        type: 'call_received',
        from: 'Caller'
      }
    };
    const params = { role_name: 'Invitee' };
    const res = addToCall({}, context, params, moment.utc());
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
