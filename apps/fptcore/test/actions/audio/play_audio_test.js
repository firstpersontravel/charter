const assert = require('assert');
const moment = require('moment');

const playAudio = require('../../../src/actions/audio/play_audio');

describe('#playAudio', () => {

  const now = moment.utc();
  const script = {
    content: {
      audio: [{
        name: 'AUDIO-1',
        path: 'audio/audio.mp3',
        duration: 120
      }]
    }
  };

  it('does nothing if audio not found', () => {
    const context = {
      Tablet: { audio: { is_playing: false } }
    };
    const res = playAudio(script, context,
      { role_name: 'Tablet', audio_name: 'AUDIO-3' }, now);
    assert.strictEqual(res, null);
  });

  it('plays audio', () => {
    const context = {
      Tablet: { audio: { is_playing: false } }
    };
    const res = playAudio(script, context,
      { role_name: 'Tablet', audio_name: 'AUDIO-1' }, now);
    assert.deepEqual(res, [
      {
        operation: 'updateParticipant',
        roleName: 'Tablet',
        updates: {
          values: {
            audio: {
              $set: {
                name: 'AUDIO-1',
                path: 'audio/audio.mp3',
                started_at: now.toISOString(),
                started_time: 0,
                paused_time: null,
                is_playing: true
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
