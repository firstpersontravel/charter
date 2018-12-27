const assert = require('assert');

const pageActions = require('../../../src/modules/page/actions');

describe('#send_to_page', () => {
  const script = {
    content: {
      roles: [{ name: 'Tablet', actor: false }],
      pages: [
        { name: 'PAGE-ONE' },
        { name: 'PAGE-ZERO' }
      ]
    }
  };

  const context = { Tablet: { page: 'PAGE-ZERO' } };

  it('sends to page', () => {
    const params = { role_name: 'Tablet', page_name: 'PAGE-ONE' };
    const res = pageActions.send_to_page.applyAction(
      script, context, params, null);
    assert.deepEqual(res, [{
      operation: 'updatePlayerFields',
      roleName: 'Tablet',
      fields: { currentPageName: 'PAGE-ONE' }
    }]);
  });

  it('sends to null', () => {
    const params = { role_name: 'Tablet', page_name: 'null' };
    const res = pageActions.send_to_page.applyAction(
      script, context, params, null);
    assert.deepEqual(res, [{
      operation: 'updatePlayerFields',
      roleName: 'Tablet',
      fields: { currentPageName: '' }
    }]);
  });
});
