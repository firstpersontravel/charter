const assert = require('assert');

const call_answered = require('../../src/events/call_answered');

describe('#call_answered', () => {
  it('fires on matching call', () => {
    const callClause = { from: 'Bob', to: 'Jim' };
    const event = { type: 'call_answered', from: 'Bob', to: 'Jim' };
    const res = call_answered.matchEvent({}, {}, callClause, event);
    assert.strictEqual(res, true);
  });

  it('does not fire on unmatched call', () => {
    const callClause = { from: 'Bob', to: 'Gale' };
    const event = { type: 'call_answered', from: 'Bob', to: 'Jim' };
    const res = call_answered.matchEvent({}, {}, callClause, event);
    assert.strictEqual(res, false);
  });
});
