const assert = require('assert');

const stateActions = require('../../../src/modules/state/actions');

describe('#set_state', () => {
  it('sets UI state', () => {
    const params = { role_name: 'Player', new_value: 'tab1' };
    const res = stateActions.set_state.applyAction({}, {}, params, null);
    assert.deepEqual(res, [{
      operation: 'updateUi',
      roleName: 'Player',
      updates: { newState: 'tab1' }
    }]);
  });
});