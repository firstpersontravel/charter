const assert = require('assert');

const pageActions = require('../../../src/modules/pages/actions');

describe('#adjust_page', () => {
  it('updates UI state', () => {
    const params = { role_name: 'Player', new_value: 'tab1' };
    const actionContext = {};

    const res = pageActions.adjust_page.applyAction(params, actionContext);

    assert.deepEqual(res, [{
      operation: 'updateUi',
      roleName: 'Player',
      updates: { newState: 'tab1' }
    }]);
  });
});

describe('#send_to_page', () => {
  const actionContext = {
    scriptContent: {
      roles: [{ name: 'Tablet', actor: false }],
      pages: [{ name: 'PAGE-ONE' }, { name: 'PAGE-ZERO' }]
    },
    evalContext: { Tablet: { page: 'PAGE-ZERO' } }
  };

  it('sends to page', () => {
    const params = { role_name: 'Tablet', page_name: 'PAGE-ONE' };

    const res = pageActions.send_to_page.applyAction(params, actionContext);

    assert.deepEqual(res, [{
      operation: 'updatePlayerFields',
      roleName: 'Tablet',
      fields: { currentPageName: 'PAGE-ONE' }
    }]);
  });

  it('sends to null', () => {
    const params = { role_name: 'Tablet', page_name: 'null' };

    const res = pageActions.send_to_page.applyAction(params, actionContext);

    assert.deepEqual(res, [{
      operation: 'updatePlayerFields',
      roleName: 'Tablet',
      fields: { currentPageName: '' }
    }]);
  });
});
