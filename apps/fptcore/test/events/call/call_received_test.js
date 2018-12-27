const assert = require('assert');

const call_received = require('../../../src/events/call/call_received');

describe('#call_received', () => {
  it('fires on matching call', () => {
    const callClause = { from: 'Bob', to: 'Jim' };
    const event = { type: 'call_received', from: 'Bob', to: 'Jim' };
    const res = call_received.matchEvent({}, {}, callClause, event);
    assert.strictEqual(res, true);
  });

  it('does not fire on unmatched call', () => {
    const callClause = { from: 'Bob', to: 'Gale' };
    const event = { type: 'call_received', from: 'Bob', to: 'Jim' };
    const res = call_received.matchEvent({}, {}, callClause, event);
    assert.strictEqual(res, false);
  });
});
