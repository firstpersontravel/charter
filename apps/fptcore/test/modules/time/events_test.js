const assert = require('assert');
const moment = require('moment');

const { time_occurred } = require('../../../src/modules/time/events');

describe('#time_occurred', () => {

  const now = 1539978196;
  const oneHourAgo = 1539974596;
  const twoHoursAgo = 1539970996;

  it('fires on matching time', () => {
    const event = {
      type: 'time_occurred',
      last_timestamp: twoHoursAgo,
      to_timestamp: now
    };
    const actionContext = {
      evalContext: {
        schedule: { 'HAPPENS': moment.unix(oneHourAgo).toISOString() }
      }
    };
    const spec = { time: 'HAPPENS' };

    const res = time_occurred.matchEvent(spec, event, actionContext);

    assert.strictEqual(res, true);

    // Test with no beginning
    delete event.last_timestamp;

    const res2 = time_occurred.matchEvent(spec, event, actionContext);

    assert.strictEqual(res2, true);
  });

  it('does not fire on time already past', () => {
    const event = {
      type: 'time_occurred',
      last_timestamp: oneHourAgo,
      to_timestamp: now
    };
    const actionContext = {
      evalContext: {
        schedule: { 'HAPPENS': moment.unix(twoHoursAgo).toISOString() }
      }
    };
    const spec = { time: 'HAPPENS' };

    const res = time_occurred.matchEvent(spec, event, actionContext);

    assert.strictEqual(res, false);
  });

  it('does not fire on time not yet arrived', () => {
    const event = {
      type: 'time_occurred',
      last_timestamp: twoHoursAgo,
      to_timestamp: oneHourAgo
    };
    const actionContext = {
      evalContext: {
        schedule: { 'HAPPENS': moment.unix(now).toISOString() }
      }
    };
    const spec = { time: 'HAPPENS' };
    const res = time_occurred.matchEvent(spec, event, actionContext);
    assert.strictEqual(res, false);

    // Test with no beginning
    delete event.last_timestamp;

    const res2 = time_occurred.matchEvent(spec, event, actionContext);

    assert.strictEqual(res2, false);
  });

  it('parses before time', () => {
    const event = {
      type: 'time_occurred',
      last_timestamp: twoHoursAgo,
      to_timestamp: oneHourAgo
    };
    const actionContext = {
      evalContext: {
        schedule: { 'HAPPENS': moment.unix(now).toISOString() }
      }
    };
    const spec = { time: 'HAPPENS', before: '90.1m' };

    const res = time_occurred.matchEvent(spec, event, actionContext);

    assert.strictEqual(res, true);

    const spec2 = { time: 'HAPPENS', before: '30.1m' };

    const res2 = time_occurred.matchEvent(spec2, event, actionContext);

    assert.strictEqual(res2, false);

    const spec3 = { time: 'HAPPENS', before: '150.1m' };
    const res3 = time_occurred.matchEvent(spec3, event, actionContext);
    assert.strictEqual(res3, false);
  });

  it('parses after time', () => {
    const event = {
      type: 'time_occurred',
      last_timestamp: oneHourAgo,
      to_timestamp: now
    };
    const actionContext = {
      evalContext: {
        schedule: { 'HAPPENS': moment.unix(twoHoursAgo).toISOString() }
      }
    };
    const spec = { time: 'HAPPENS', after: '5400s' };

    const res = time_occurred.matchEvent(spec, event, actionContext);

    assert.strictEqual(res, true);

    const spec2 = { time: 'HAPPENS', after: '900s' };

    const res2 = time_occurred.matchEvent(spec2, event, actionContext);

    assert.strictEqual(res2, false);

    const spec3 = { time: 'HAPPENS', after: '9000s' };

    const res3 = time_occurred.matchEvent(spec3, event, actionContext);

    assert.strictEqual(res3, false);
  });

  it('does not fire on exact match at start', () => {
    const event = {
      type: 'time_occurred',
      last_timestamp: twoHoursAgo,
      to_timestamp: oneHourAgo
    };
    const actionContext = {
      evalContext: {
        schedule: { 'HAPPENS': moment.unix(twoHoursAgo).toISOString() }
      }
    };
    const spec = { time: 'HAPPENS', before: '0h' };

    const res = time_occurred.matchEvent(spec, event, actionContext);

    assert.strictEqual(res, false);
  });

  it('fires on exact match at end', () => {
    const event = {
      type: 'time_occurred',
      last_timestamp: twoHoursAgo,
      to_timestamp: oneHourAgo
    };
    const actionContext = {
      evalContext: {
        schedule: { 'HAPPENS': moment.unix(oneHourAgo).toISOString() }
      }
    };
    const spec = { time: 'HAPPENS', before: '0h' };

    const res = time_occurred.matchEvent(spec, event, actionContext);

    assert.strictEqual(res, true);
  });

  it('does not fire if time is absent', () => {
    const event = {
      type: 'time_occurred',
      last_timestamp: twoHoursAgo,
      to_timestamp: oneHourAgo
    };
    const actionContext = {
      evalContext: {
        schedule: {}
      }
    };
    const spec = { time: 'HAPPENS', before: '0h' };

    const res = time_occurred.matchEvent(spec, event, actionContext);

    assert.strictEqual(res, false);
  });
});
