const assert = require('assert');

const { send_to_page } = require('../../../src/modules/page/actions');

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

    const res = send_to_page.applyAction(params, actionContext);

    assert.deepEqual(res, [{
      operation: 'updatePlayerFields',
      roleName: 'Tablet',
      fields: { currentPageName: 'PAGE-ONE' }
    }]);
  });

  it('sends to null', () => {
    const params = { role_name: 'Tablet', page_name: 'null' };

    const res = send_to_page.applyAction(params, actionContext);

    assert.deepEqual(res, [{
      operation: 'updatePlayerFields',
      roleName: 'Tablet',
      fields: { currentPageName: '' }
    }]);
  });
});
