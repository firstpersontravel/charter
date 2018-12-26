const assert = require('assert');
const moment = require('moment');

const pauseAudio = require('../../../src/actions/audio/pause_audio');

describe('#pause_audio', () => {

  it('does nothing if no audio', () => {
    const context = { Tablet: {} };
    const res = pauseAudio({}, context, { role_name: 'Tablet' }, null);
    assert.strictEqual(res, null);
  });

  it('does nothing if audio is paused', () => {
    const context = {
      Tablet: { audio: { is_playing: false } }
    };
    const res = pauseAudio({}, context, { role_name: 'Tablet' }, null);
    assert.strictEqual(res, null);
  });

  it('pauses and updates value', () => {
    // Audio started a minute ago
    const applyAt = moment.utc();
    const context = {
      Tablet: {
        audio: {
          is_playing: true,
          started_at: applyAt.clone().subtract(1, 'minutes').toISOString(),
          started_time: 10
        }
      }
    };
    const res = pauseAudio({}, context, { role_name: 'Tablet' }, applyAt);
    assert.deepEqual(res, [{
      operation: 'updatePlayer',
      roleName: 'Tablet',
      updates: {
        values: {
          audio: {
            is_playing: { $set: false },
            paused_time: { $set: 70 }
          }
        }
      }
    }, {
      operation: 'updateAudio'
    }]);
  });
});
