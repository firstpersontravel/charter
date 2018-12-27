const assert = require('assert');

const call_ended = require('../../src/events/call_ended');

describe('#call_ended', () => {
  it('fires on matching call ended', () => {
    const callClause = { role: 'King' };
    const event = { type: 'call_ended', roles: ['King', 'Queen'] };
    const res = call_ended.matchEvent({}, {}, callClause, event);
    assert.strictEqual(res, true);
  });

  it('does not fire on unmatched call', () => {
    const callClause = { role: 'Jack' };
    const event = { type: 'call_ended', roles: ['King', 'Queen'] };
    const res = call_ended.matchEvent({}, {}, callClause, event);
    assert.strictEqual(res, false);
  });
});
