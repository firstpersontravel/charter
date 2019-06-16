const assert = require('assert');

const adjust_page = require('../../../src/modules/pages/page_adjust');

describe('#adjust_page', () => {
  it('updates UI state', () => {
    const params = { role_name: 'Player', new_value: 'tab1' };
    const actionContext = {};

    const res = adjust_page.getOps(params, actionContext);

    assert.deepEqual(res, [{
      operation: 'updateUi',
      roleName: 'Player',
      updates: { newState: 'tab1' }
    }]);
  });
});
