const assert = require('assert');

const setState = require('../../../src/actions/state/set_state');

describe('#setState', () => {
  it('sets UI state', () => {
    const params = { role_name: 'Player', new_value: 'tab1' };
    const res = setState.applyAction({}, {}, params, null);
    assert.deepEqual(res, [{
      operation: 'updateUi',
      roleName: 'Player',
      updates: { newState: 'tab1' }
    }]);
  });
});