const assert = require('assert');

const cue_signaled = require('../../src/events/cue_signaled');

describe('#cue_signaled', () => {
  it('fires on matching cue', () => {
    const event = { type: 'cue_signaled', cue: 'abc' };
    const res = cue_signaled.matchEvent({}, {}, 'abc', event);
    assert.strictEqual(res, true);
  });

  it('does not fire on unmatched cue', () => {
    const event = { type: 'cue_signaled', cue_signaled: 'def' };
    const res = cue_signaled.matchEvent({}, {}, 'abc', event);
    assert.strictEqual(res, false);
  });
});
