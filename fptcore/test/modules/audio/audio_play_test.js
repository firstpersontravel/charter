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
      evalContext: { audio_is_playing: false },
      evaluateAt: now
    };
    const res = play_audio.getOps(params, actionContext);
    assert.deepEqual(res, [
      {
        operation: 'updateTripValues',
        values: {
          audio_role: 'Tablet',
          audio_title: 'My soundtrack',
          audio_url: 'https://server/audio/audio.mp3',
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

  it('plays for current role if supplied', () => {
    const params = {
      role_name: 'current',
      audio: 'https://server/audio/audio.mp3',
      title: 'My soundtrack'
    };
    const actionContext = {
      scriptContent: {},
      evalContext: { audio_is_playing: false },
      triggeringRoleName: 'CurrentRole',
      evaluateAt: now
    };
    const res = play_audio.getOps(params, actionContext);
    assert.deepEqual(res, [
      {
        operation: 'updateTripValues',
        values: {
          audio_role: 'CurrentRole',
          audio_title: 'My soundtrack',
          audio_url: 'https://server/audio/audio.mp3',
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
