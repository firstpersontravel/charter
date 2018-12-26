const assert = require('assert');

const sendToPage = require('../../src/actions/send_to_page');

describe('#sendToPage', () => {

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
    const res = sendToPage(script, context, params, null);
    assert.deepEqual(res, [{
      operation: 'updatePlayer',
      roleName: 'Tablet',
      updates: {
        currentPageName: { $set: 'PAGE-ONE' }
      }
    }]);
  });

  it('sends to null', () => {
    const params = { role_name: 'Tablet', page_name: 'null' };
    const res = sendToPage(script, context, params, null);
    assert.deepEqual(res, [{
      operation: 'updatePlayer',
      roleName: 'Tablet',
      updates: {
        currentPageName: { $set: '' }
      }
    }]);
  });
});
