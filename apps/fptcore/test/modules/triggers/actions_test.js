const assert = require('assert');

const triggerActions = require('../../../src/modules/triggers/actions');

describe('#signal_cue', () => {
  it('does nothing', () => {
    const res = triggerActions.signal_cue.applyAction({}, {});
    assert.strictEqual(res, null);
  });

  it('generates an event', () => {
    const event = triggerActions.signal_cue.eventForParams({ cue_name: 'hi' });
    assert.deepStrictEqual(event, { type: 'cue_signaled', cue: 'hi' });
  });
});
