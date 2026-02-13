const assert = require('assert');
const moment = require('moment');

const resume_audio = require('../../../src/modules/audio/audio_resume').default;

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
      evalContext: { tripState: {} },
      evaluateAt: now
    };
    const res = resume_audio.getOps(params, actionContext);
    assert.deepStrictEqual(res, [{
      operation: 'log',
      level: 'error',
      message: 'Tried to resume audio when none was started.'
    }]);
  });

  it('logs warning if playing', () => {
    const params = { role_name: 'Tablet' };
    const actionContext = {
      scriptContent: scriptContent,
      evalContext: { tripState: { audioStateByRole: { Tablet: { isPlaying: true } } } },
      evaluateAt: now
    };
    const res = resume_audio.getOps(params, actionContext);
    assert.deepStrictEqual(res, [{
      operation: 'log',
      level: 'warn',
      message: 'Tried to resume audio when audio was already playing.'
    }]);
  });

  it('resume audio', () => {
    const params = { role_name: 'Tablet' };
    const actionContext = {
      scriptContent: scriptContent,
      evalContext: {
        tripState: { audioStateByRole: { Tablet: { isPlaying: false, pausedTime: 10 } } }
      },
      evaluateAt: now
    };
    const res = resume_audio.getOps(params, actionContext);
    assert.deepStrictEqual(res, [
      {
        operation: 'updateTripFields',
        fields: {
          tripState: {
            audioStateByRole: {
              Tablet: {
                isPlaying: true,
                startedAt: now.toISOString(),
                startedTime: 10,
                pausedTime: null
              }
            }
          }
        }
      }, {
        operation: 'updateAudio'
      }
    ]);
  });
});
