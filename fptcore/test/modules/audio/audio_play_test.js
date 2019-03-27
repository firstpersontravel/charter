const assert = require('assert');
const moment = require('moment');

const play_audio = require('../../../src/modules/audio/audio_play');

describe('#play_audio', () => {
  const now = moment.utc();
  const scriptContent = {
    audio: [{
      name: 'AUDIO-1',
      path: 'audio/audio.mp3',
      duration: 120
    }]
  };

  it('logs error if audio not found', () => {
    const params = { role_name: 'Tablet', audio_name: 'AUDIO-3' };
    const actionContext = {
      scriptContent: scriptContent,
      evalContext: { audio_is_playing: false },
      evaluateAt: now
    };
    const res = play_audio.applyAction(params, actionContext);
    assert.deepStrictEqual(res, [{
      operation: 'log',
      level: 'error',
      message: 'Could not find audio named "AUDIO-3".'
    }]);
  });

  it('plays audio', () => {
    const params = { role_name: 'Tablet', audio_name: 'AUDIO-1' };
    const actionContext = {
      scriptContent: scriptContent,
      evalContext: { audio_is_playing: false },
      evaluateAt: now
    };
    const res = play_audio.applyAction(params, actionContext);
    assert.deepEqual(res, [
      {
        operation: 'updateTripValues',
        values: {
          audio_name: 'AUDIO-1',
          audio_role: 'Tablet',
          audio_path: 'audio/audio.mp3',
          audio_started_at: now.toISOString(),
          audio_started_time: 0,
          audio_paused_time: null,
          audio_is_playing: true
        }
      }, {
        operation: 'updateAudio'
      }
    ]);
  });
});
