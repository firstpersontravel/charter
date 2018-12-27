const assert = require('assert');

const cueActions = require('../../../src/modules/cue/actions');

describe('#signal_cue', () => {
  it('does nothing', () => {
    const res = cueActions.signal_cue.applyAction({}, {}, {}, null);
    assert.strictEqual(res, null);
  });

  it('generates an event', () => {
    const event = cueActions.signal_cue.eventForParams({ cue_name: 'hi' });
    assert.deepStrictEqual(event, { type: 'cue_signaled', cue: 'hi' });
  });
});
