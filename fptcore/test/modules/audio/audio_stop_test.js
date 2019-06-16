const assert = require('assert');
const moment = require('moment');

const stop_audio = require('../../../src/modules/audio/audio_stop');

describe('#stop_audio', () => {
  it('stops audio', () => {
    const params = { role_name: 'Tablet' };
    const actionContext = {
      scriptContent: {},
      evalContext: { audio_is_playing: false, audio_paused_time: 10 },
      evaluateAt: moment.utc()
    };
    const res = stop_audio.getOps(params, actionContext);
    assert.deepEqual(res, [
      {
        operation: 'updateTripValues',
        values: {
          audio_role: null,
          audio_path: null,
          audio_started_at: null,
          audio_started_time: null,
          audio_paused_time: null,
          audio_is_playing: false
        }
      }, {
        operation: 'updateAudio'
      }
    ]);
  });
});
