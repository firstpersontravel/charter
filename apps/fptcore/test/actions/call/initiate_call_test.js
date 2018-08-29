const assert = require('assert');
const moment = require('moment');

const initiateCall = require('../../../src/actions/call/initiate_call');

describe('#initiateCall', () => {

  it('starts a conference from incoming call', () => {
    const context = {};
    const params = { to_role_name: 'Callee', as_role_name: 'Actor' };
    const res = initiateCall({}, context, params, moment.utc());
    assert.deepEqual(res, [{
      operation: 'initiateCall',
      toRoleName: 'Callee',
      asRoleName: 'Actor',
      detectVoicemail: false
    }]);
  });
});
