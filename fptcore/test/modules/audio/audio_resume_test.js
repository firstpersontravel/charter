const assert = require('assert');
const moment = require('moment');

const resume_audio = require('../../../src/modules/audio/audio_resume');

describe('#resume_audio', () => {
  const now = moment.utc();
  const scriptContent = {
    audio: [{
      name: 'AUDIO-1',
      path: 'audio/audio.mp3',
      duration: 120
    }]
  };

  it('logs error if not started', () => {
    const params = { role_name: 'Tablet' };
    const actionContext = {
      scriptContent: scriptContent,
      evalContext: {},
      evaluateAt: now
    };
    const res = resume_audio.getOps(params, actionContext);
    assert.deepStrictEqual(res, [{
      operation: 'log',
      level: 'error',
      message: 'Tried to resume audio when no pause time was available.'
    }]);
  });

  it('logs warning if playing', () => {
    const params = { role_name: 'Tablet' };
    const actionContext = {
      scriptContent: scriptContent,
      evalContext: { audio_is_playing: true },
      evaluateAt: now
    };
    const res = resume_audio.getOps(params, actionContext);
    assert.deepStrictEqual(res, [{
      operation: 'log',
      level: 'warning',
      message: 'Tried to resume audio when audio was already playing.'
    }]);
  });

  it('resume audio', () => {
    const params = { role_name: 'Tablet' };
    const actionContext = {
      scriptContent: scriptContent,
      evalContext: { audio_is_playing: false, audio_paused_time: 10 },
      evaluateAt: now
    };
    const res = resume_audio.getOps(params, actionContext);
    assert.deepEqual(res, [
      {
        operation: 'updateTripValues',
        values: {
          audio_is_playing: true,
          audio_started_at: now.toISOString(),
          audio_started_time: 10,
          audio_paused_time: null
        }
      }, {
        operation: 'updateAudio'
      }
    ]);
  });
});
