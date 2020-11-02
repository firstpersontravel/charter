const assert = require('assert');

const call_received = require('../../../src/modules/calls/call_received');

describe('#call_received', () => {
  it('fires on matching call', () => {
    const spec = { from: 'Bob', to: 'Jim' };
    const event = { type: 'call_received', from: 'Bob', to: 'Jim' };

    const res = call_received.matchEvent(spec, event, {});

    assert.strictEqual(res, true);
  });

  it('does not fire on unmatched call', () => {
    const spec = { from: 'Bob', to: 'Gale' };
    const event = { type: 'call_received', from: 'Bob', to: 'Jim' };

    const res = call_received.matchEvent(spec, event, {});

    assert.strictEqual(res, false);
  });
});
