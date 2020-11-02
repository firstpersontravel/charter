const assert = require('assert');
const moment = require('moment');

const time_occurred = require('../../../src/modules/time/time_occurred');

describe('#time_occurred', () => {

  const now = 1539978196;
  const oneHourAgo = 1539974596;
  const twoHoursAgo = 1539970996;

  it('fires on matching time', () => {
    const event = {
      type: 'time_occurred',
      timestamp: now
    };
    const actionContext = {
      evalContext: {
        schedule: { 'HAPPENS': moment.unix(oneHourAgo).toISOString() }
      }
    };
    const spec = { time: 'HAPPENS' };

    const res = time_occurred.matchEvent(spec, event, actionContext);

    assert.strictEqual(res, true);
  });

  it('fires on time already past', () => {
    const event = {
      type: 'time_occurred',
      timestamp: now
    };
    const actionContext = {
      evalContext: {
        schedule: { 'HAPPENS': moment.unix(twoHoursAgo).toISOString() }
      }
    };
    const spec = { time: 'HAPPENS' };

    const res = time_occurred.matchEvent(spec, event, actionContext);

    assert.strictEqual(res, true);
  });

  it('does not fire on time not yet arrived', () => {
    const event = {
      type: 'time_occurred',
      timestamp: oneHourAgo
    };
    const actionContext = {
      evalContext: {
        schedule: { 'HAPPENS': moment.unix(now).toISOString() }
      }
    };
    const spec = { time: 'HAPPENS' };
    const res = time_occurred.matchEvent(spec, event, actionContext);
    assert.strictEqual(res, false);
  });

  it('parses before time', () => {
    const event = {
      type: 'time_occurred',
      timestamp: oneHourAgo
    };
    const actionContext = {
      evalContext: {
        schedule: { 'HAPPENS': moment.unix(now).toISOString() }
      }
    };
    const spec = { time: 'HAPPENS', offset: '-90.1m' };

    const res = time_occurred.matchEvent(spec, event, actionContext);

    assert.strictEqual(res, true);

    const spec2 = { time: 'HAPPENS', offset: '-30.1m' };

    const res2 = time_occurred.matchEvent(spec2, event, actionContext);

    assert.strictEqual(res2, false);
  });

  it('parses after time', () => {
    const event = {
      type: 'time_occurred',
      timestamp: now
    };
    const actionContext = {
      evalContext: {
        schedule: { 'HAPPENS': moment.unix(twoHoursAgo).toISOString() }
      }
    };
    const spec = { time: 'HAPPENS', offset: '5400s' };

    const res = time_occurred.matchEvent(spec, event, actionContext);

    assert.strictEqual(res, true);

    const spec2 = { time: 'HAPPENS', offset: '900s' };

    const res2 = time_occurred.matchEvent(spec2, event, actionContext);

    assert.strictEqual(res2, true);

    const spec3 = { time: 'HAPPENS', offset: '9000s' };

    const res3 = time_occurred.matchEvent(spec3, event, actionContext);

    assert.strictEqual(res3, false);
  });

  it('fires on exact match at end', () => {
    const event = {
      type: 'time_occurred',
      timestamp: oneHourAgo
    };
    const actionContext = {
      evalContext: {
        schedule: { 'HAPPENS': moment.unix(oneHourAgo).toISOString() }
      }
    };
    const spec = { time: 'HAPPENS', offset: '0h' };

    const res = time_occurred.matchEvent(spec, event, actionContext);

    assert.strictEqual(res, true);
  });

  it('does not fire if time is absent', () => {
    const event = {
      type: 'time_occurred',
      timestamp: oneHourAgo
    };
    const actionContext = {
      evalContext: {
        schedule: {}
      }
    };
    const spec = { time: 'HAPPENS', offset: '0h' };

    const res = time_occurred.matchEvent(spec, event, actionContext);

    assert.strictEqual(res, false);
  });
});
