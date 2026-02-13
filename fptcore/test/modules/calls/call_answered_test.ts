const assert = require('assert');

const call_answered = require('../../../src/modules/calls/call_answered').default;

describe('#call_answered', () => {
  it('fires on matching call', () => {
    const spec = { from: 'Bob', to: 'Jim' };
    const event = { type: 'call_answered', from: 'Bob', to: 'Jim' };

    const res = call_answered.matchEvent(spec, event, {});

    assert.strictEqual(res, true);
  });

  it('does not fire on unmatched call', () => {
    const spec = { from: 'Bob', to: 'Gale' };
    const event = { type: 'call_answered', from: 'Bob', to: 'Jim' };

    const res = call_answered.matchEvent(spec, event, {});

    assert.strictEqual(res, false);
  });
});
