const assert = require('assert');

const signal_cue = require('../../../src/modules/cues/cue_signal');

describe('#signal_cue', () => {
  it('generates an event', () => {
    const res = signal_cue.applyAction({ cue_name: 'hi' }, {});
    assert.deepStrictEqual(res, [{
      operation: 'event',
      event: { type: 'cue_signaled', cue: 'hi' }
    }]);
  });
});
