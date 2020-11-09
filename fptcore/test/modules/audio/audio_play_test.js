const assert = require('assert');
const moment = require('moment');

const play_audio = require('../../../src/modules/audio/audio_play');

describe('#play_audio', () => {
  const now = moment.utc();

  it('plays audio', () => {
    const params = {
      role_name: 'Tablet',
      audio: 'https://server/audio/audio.mp3',
      title: 'My soundtrack'
    };
    const actionContext = {
      scriptContent: {},
      evalContext: { tripState: { audioStateByRole: { Tablet: { isPlaying: false } } } },
      evaluateAt: now
    };
    const res = play_audio.getOps(params, actionContext);
    assert.deepStrictEqual(res, [
      {
        operation: 'updateTripFields',
        fields: {
          tripState: {
            audioStateByRole: {
              Tablet: {
                title: 'My soundtrack',
                url: 'https://server/audio/audio.mp3',
                startedAt: now.toISOString(),
                startedTime: 0,
                pausedTime: null,
                isPlaying: true
              }
            }
          }
        }
      }, {
        operation: 'updateAudio'
      }
    ]);
  });

  it('plays for current role if supplied', () => {
    const params = {
      role_name: 'current',
      audio: 'https://server/audio/audio.mp3',
      title: 'My soundtrack'
    };
    const actionContext = {
      scriptContent: {},
      evalContext: { tripState: {} },
      triggeringRoleName: 'CurrentRole',
      evaluateAt: now
    };
    const res = play_audio.getOps(params, actionContext);
    assert.deepStrictEqual(res, [
      {
        operation: 'updateTripFields',
        fields: {
          tripState: {
            audioStateByRole: {
              CurrentRole: {
                title: 'My soundtrack',
                url: 'https://server/audio/audio.mp3',
                startedAt: now.toISOString(),
                startedTime: 0,
                pausedTime: null,
                isPlaying: true
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
