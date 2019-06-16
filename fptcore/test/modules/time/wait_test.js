const assert = require('assert');
const moment = require('moment');

const wait = require('../../../src/modules/time/wait');

describe('#wait', () => {
  it('waits fixed period', () => {
    const now = moment.utc();
    const params = { duration: '10h' };
    const actionContext = { evaluateAt: now };

    const res = wait.getOps(params, actionContext);

    assert.deepStrictEqual(res, [{
      operation: 'wait',
      until: now.clone().add(10, 'hours')
    }]);
  });
});
