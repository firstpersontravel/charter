const assert = require('assert');
const moment = require('moment');

const resumeAudio = require('../../../src/actions/audio/resume_audio');

describe('#resumeAudio', () => {

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

  it('does nothing if not paused', () => {
    const context = { Tablet: { audio: null } };
    const res = resumeAudio(script, context, { role_name: 'Tablet' }, now);
    assert.strictEqual(res, null);
  });

  it('does nothing if playing', () => {
    const context = { Tablet: { audio: { is_playing: true } } };
    const res = resumeAudio(script, context, { role_name: 'Tablet' }, now);
    assert.strictEqual(res, null);
  });

  it('resume audio', () => {
    const context = {
      Tablet: { audio: { is_playing: false, paused_time: 10 } }
    };
    const res = resumeAudio(script, context, { role_name: 'Tablet' }, now);
    assert.deepEqual(res, [
      {
        operation: 'updateParticipant',
        roleName: 'Tablet',
        updates: {
          values: {
            audio: {
              is_playing: { $set: true },
              started_at: { $set: now.toISOString() },
              started_time: { $set: 10 },
              paused_time: { $set: null }
            }
          }
        }
      }, {
        operation: 'updateAudio'
      }
    ]);
  });
});
