const assert = require('assert');

const cue = require('../../src/actions/cue');

describe('#cue', () => {
  it('does nothing', () => {
    const res = cue({}, {}, {}, null);
    assert.strictEqual(res, null);
  });

  it('generates an event', () => {
    const event = cue.eventForParams({ cue_name: 'hi' });
    assert.deepStrictEqual(event, { type: 'cue_signaled', cue: 'hi' });
  });
});
