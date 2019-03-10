const assert = require('assert');

const triggerEvents = require('../../../src/modules/triggers/events');

describe('#cue_signaled', () => {
  it('fires on matching cue', () => {
    const event = { type: 'cue_signaled', cue: 'abc' };

    const res = triggerEvents.cue_signaled.matchEvent({ cue: 'abc' }, event, {});

    assert.strictEqual(res, true);
  });

  it('does not fire on unmatched cue', () => {
    const event = { type: 'cue_signaled', cue_signaled: 'def' };

    const res = triggerEvents.cue_signaled.matchEvent({ cue: 'abc' }, event, {});

    assert.strictEqual(res, false);
  });
});
