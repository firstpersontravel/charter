const assert = require('assert');

const call_ended = require('../../../src/modules/calls/call_ended');

describe('#call_ended', () => {
  it('fires on matching call ended', () => {
    const spec = { role: 'King' };
    const event = { type: 'call_ended', roles: ['King', 'Queen'] };

    const res = call_ended.matchEvent(spec, event, {});

    assert.strictEqual(res, true);
  });

  it('does not fire on unmatched call', () => {
    const spec = { role: 'Jack' };
    const event = { type: 'call_ended', roles: ['King', 'Queen'] };

    const res = call_ended.matchEvent(spec, event, {});

    assert.strictEqual(res, false);
  });
});
