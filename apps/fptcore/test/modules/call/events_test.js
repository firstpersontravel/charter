const assert = require('assert');

const callEvents = require('../../../src/modules/call/events');

describe('#call_answered', () => {
  it('fires on matching call', () => {
    const spec = { from: 'Bob', to: 'Jim' };
    const event = { type: 'call_answered', from: 'Bob', to: 'Jim' };

    const res = callEvents.call_answered.matchEvent(spec, event, {});

    assert.strictEqual(res, true);
  });

  it('does not fire on unmatched call', () => {
    const spec = { from: 'Bob', to: 'Gale' };
    const event = { type: 'call_answered', from: 'Bob', to: 'Jim' };

    const res = callEvents.call_answered.matchEvent(spec, event, {});

    assert.strictEqual(res, false);
  });
});

describe('#call_ended', () => {
  it('fires on matching call ended', () => {
    const spec = { role: 'King' };
    const event = { type: 'call_ended', roles: ['King', 'Queen'] };

    const res = callEvents.call_ended.matchEvent(spec, event, {});

    assert.strictEqual(res, true);
  });

  it('does not fire on unmatched call', () => {
    const spec = { role: 'Jack' };
    const event = { type: 'call_ended', roles: ['King', 'Queen'] };

    const res = callEvents.call_ended.matchEvent(spec, event, {});

    assert.strictEqual(res, false);
  });
});

describe('#call_received', () => {
  it('fires on matching call', () => {
    const spec = { from: 'Bob', to: 'Jim' };
    const event = { type: 'call_received', from: 'Bob', to: 'Jim' };

    const res = callEvents.call_received.matchEvent(spec, event, {});

    assert.strictEqual(res, true);
  });

  it('does not fire on unmatched call', () => {
    const spec = { from: 'Bob', to: 'Gale' };
    const event = { type: 'call_received', from: 'Bob', to: 'Jim' };

    const res = callEvents.call_received.matchEvent(spec, event, {});

    assert.strictEqual(res, false);
  });
});
