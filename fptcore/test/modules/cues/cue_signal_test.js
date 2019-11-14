const assert = require('assert');

const signal_cue = require('../../../src/modules/cues/cue_signal');

describe('#signal_cue', () => {
  it('generates an event', () => {
    const res = signal_cue.getOps({ cue_name: 'hi' }, {
      scriptContent: { cues: [{ name: 'hi' }] }
    });
    assert.deepStrictEqual(res, [{
      operation: 'event',
      scope: 'trip',
      event: { type: 'cue_signaled', cue: 'hi' }
    }]);
  });

  it('generates scoped cue events', () => {
    const res = signal_cue.getOps({ cue_name: 'hi' }, {
      scriptContent: { cues: [{ name: 'hi', scope: 'group' }] }
    });
    assert.strictEqual(res[0].scope, 'group');

    const res2 = signal_cue.getOps({ cue_name: 'hi' }, {
      scriptContent: { cues: [{ name: 'hi', scope: 'experience' }] }
    });
    assert.strictEqual(res2[0].scope, 'experience');
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
