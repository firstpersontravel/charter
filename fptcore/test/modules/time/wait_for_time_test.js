const assert = require('assert');
const moment = require('moment');

const wait_for_time = require('../../../src/modules/time/wait_for_time');

describe('#wait_for_time', () => {
  it('waits for a time', () => {
    const now = moment.utc();
    const waitFor = moment.utc('2020-01-01T00:00:00.000Z');
    const params = { until: 't' };
    const actionContext = {
      evaluateAt: now,
      evalContext: { schedule: { t: waitFor.toISOString() } }
    };

    const res = wait_for_time.applyAction(params, actionContext);

    assert.deepStrictEqual(res, [{
      operation: 'wait',
      until: waitFor
    }]);
  });

  it('errors if time does not exist', () => {
    const now = moment.utc();
    const params = { until: 't' };
    const actionContext = { evaluateAt: now, evalContext: { schedule: {} } };

    const res = wait_for_time.applyAction(params, actionContext);

    assert.deepStrictEqual(res, [{
      operation: 'log',
      level: 'warning',
      message: 'Could not find time matching "t".'
    }]);
  });
});
