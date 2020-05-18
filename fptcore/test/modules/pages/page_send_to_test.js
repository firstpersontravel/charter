const assert = require('assert');

const send_to_page = require('../../../src/modules/pages/page_send_to');

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

describe('#send_to_page', () => {
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

  it('sends current role to page if supplied', () => {
    const params = { role_name: 'current', page_name: 'PAGE-ONE' };
    const actionContextWithEvent = Object.assign({}, actionContext, {
      evalContext: Object.assign({}, actionContext.evalContext, {
        event: { role_name: 'CurrentRole' }
      })
    });

    const res = send_to_page.getOps(params, actionContextWithEvent);

    assert.deepEqual(res, [{
      operation: 'updateTripFields',
      fields: {
        tripState: {
          currentSceneName: 'SCENE',
          currentPageNamesByRole: {
            Tablet: 'PAGE-ZERO',
            CurrentRole: 'PAGE-ONE'
          }
        }
      }
    }]);
  });

  it('logs error if current role is not supplied', () => {
    const params = { role_name: 'current', page_name: 'PAGE-ONE' };

    const res = send_to_page.getOps(params, actionContext);

    assert.deepEqual(res, [{
      operation: 'log',
      level: 'error',
      message: 'No current role in event when expected.'
    }]);
  });
});
