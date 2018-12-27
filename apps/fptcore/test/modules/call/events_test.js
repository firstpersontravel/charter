const assert = require('assert');

const callEvents = require('../../../src/modules/call/events');

describe('#call_answered', () => {
  it('fires on matching call', () => {
    const callClause = { from: 'Bob', to: 'Jim' };
    const event = { type: 'call_answered', from: 'Bob', to: 'Jim' };
    const res = callEvents.call_answered.matchEvent({}, {}, callClause, event);
    assert.strictEqual(res, true);
  });

  it('does not fire on unmatched call', () => {
    const callClause = { from: 'Bob', to: 'Gale' };
    const event = { type: 'call_answered', from: 'Bob', to: 'Jim' };
    const res = callEvents.call_answered.matchEvent({}, {}, callClause, event);
    assert.strictEqual(res, false);
  });
});

describe('#call_ended', () => {
  it('fires on matching call ended', () => {
    const callClause = { role: 'King' };
    const event = { type: 'call_ended', roles: ['King', 'Queen'] };
    const res = callEvents.call_ended.matchEvent({}, {}, callClause, event);
    assert.strictEqual(res, true);
  });

  it('does not fire on unmatched call', () => {
    const callClause = { role: 'Jack' };
    const event = { type: 'call_ended', roles: ['King', 'Queen'] };
    const res = callEvents.call_ended.matchEvent({}, {}, callClause, event);
    assert.strictEqual(res, false);
  });
});

describe('#call_received', () => {
  it('fires on matching call', () => {
    const callClause = { from: 'Bob', to: 'Jim' };
    const event = { type: 'call_received', from: 'Bob', to: 'Jim' };
    const res = callEvents.call_received.matchEvent({}, {}, callClause, event);
    assert.strictEqual(res, true);
  });

  it('does not fire on unmatched call', () => {
    const callClause = { from: 'Bob', to: 'Gale' };
    const event = { type: 'call_received', from: 'Bob', to: 'Jim' };
    const res = callEvents.call_received.matchEvent({}, {}, callClause, event);
    assert.strictEqual(res, false);
  });
});
