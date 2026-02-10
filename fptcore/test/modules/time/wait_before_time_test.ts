const assert = require('assert');
const moment = require('moment');

const wait_before_time = require('../../../src/modules/time/wait_before_time');

describe('#wait_before_time', () => {
  it('waits for a period before a time', () => {
    const now = moment.utc();
    const waitFor = moment.utc('2028-01-01T00:00:00.000Z');
    const params = { until: 't', before: '10s' };
    const actionContext = {
      evaluateAt: now,
      evalContext: { schedule: { t: waitFor.toISOString() } }
    };

    const res = wait_before_time.getOps(params, actionContext);

    assert.deepStrictEqual(res, [{
      operation: 'wait',
      until: waitFor.clone().subtract(10, 'seconds')
    }]);
  });

  it('does nothing if time has already elapsed', () => {
    const now = moment.utc();
    const waitFor = moment.utc('2010-01-01T00:00:00.000Z');
    const params = { until: 't', before: '10s' };
    const actionContext = {
      evaluateAt: now,
      evalContext: { schedule: { t: waitFor.toISOString() } }
    };

    const res = wait_before_time.getOps(params, actionContext);

    assert.deepStrictEqual(res, []);
  });

  it('errors if time does not exist', () => {
    const now = moment.utc();
    const params = { until: 't', before: '5m' };
    const actionContext = { evaluateAt: now, evalContext: { schedule: {} } };

    const res = wait_before_time.getOps(params, actionContext);

    assert.deepStrictEqual(res, [{
      operation: 'log',
      level: 'warn',
      message: 'Could not find time matching "t".'
    }]);
  });
});
