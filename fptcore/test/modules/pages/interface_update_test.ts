const assert = require('assert');

const update_interface = require(
  '../../../src/modules/pages/interface_update').default;

describe('#update_interface', () => {
  it('updates UI state', () => {
    const params = { role_name: 'Player', new_value: 'tab1' };
    const actionContext = {};

    const res = update_interface.getOps(params, actionContext);

    assert.deepEqual(res, [{
      operation: 'updateUi',
      roleName: 'Player',
      updates: { newState: 'tab1' }
    }]);
  });
});
