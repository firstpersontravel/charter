const assert = require('assert');

const send_to_page = require('../../../src/modules/pages/page_send_to');

describe('#send_to_page', () => {
  const actionContext = {
    scriptContent: {
      roles: [{ name: 'Tablet', actor: false }],
      pages: [{ name: 'PAGE-ONE' }, { name: 'PAGE-ZERO' }]
    },
    evalContext: {
      tripState: {
        currentSceneName: 'SCENE',
        currentPageNamesByRole: { Tablet: 'PAGE-ZERO' }
      }
    }
  };

  it('sends to page', () => {
    const params = { role_name: 'Tablet', page_name: 'PAGE-ONE' };

    const res = send_to_page.getOps(params, actionContext);

    assert.deepEqual(res, [{
      operation: 'updateTripFields',
      fields: {
        tripState: {
          currentSceneName: 'SCENE',
          currentPageNamesByRole: { Tablet: 'PAGE-ONE' }
        }
      }
    }]);
  });

  it('sends to null', () => {
    const params = { role_name: 'Tablet', page_name: 'null' };

    const res = send_to_page.getOps(params, actionContext);

    assert.deepEqual(res, [{
      operation: 'updateTripFields',
      fields: {
        tripState: {
          currentSceneName: 'SCENE',
          currentPageNamesByRole: { Tablet: '' }
        }
      }
    }]);
  });
});
