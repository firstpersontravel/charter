const assert = require('assert');

const signal_cue = require('../../../src/modules/cues/cue_signal');

describe('#signal_cue', () => {
  it('generates an event', () => {
    const res = signal_cue.getOps({ cue_name: 'hi' }, {
      scriptContent: { cues: [{ name: 'hi' }] }
    });
    assert.deepStrictEqual(res, [{
      operation: 'event',
      event: { type: 'cue_signaled', cue: 'hi' }
    }]);
  });

  it('logs an error if cue is not found', () => {
    const res = signal_cue.getOps({ cue_name: 'hi2' }, {
      scriptContent: { cues: [{ name: 'hi' }] }
    });
    assert.deepStrictEqual(res, [{
      operation: 'log',
      level: 'error',
      message: 'Could not find cue named "hi2".'
    }]);
  });
});
