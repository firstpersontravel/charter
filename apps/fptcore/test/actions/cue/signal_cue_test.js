const assert = require('assert');

const signal_cue = require('../../../src/actions/cue/signal_cue');

describe('#signal_cue', () => {
  it('does nothing', () => {
    const res = signal_cue({}, {}, {}, null);
    assert.strictEqual(res, null);
  });

  it('generates an event', () => {
    const event = signal_cue.eventForParams({ cue_name: 'hi' });
    assert.deepStrictEqual(event, { type: 'cue_signaled', cue: 'hi' });
  });
});
