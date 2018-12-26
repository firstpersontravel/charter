const assert = require('assert');
const moment = require('moment');

const stopAudio = require('../../../src/actions/audio/stop_audio');

describe('#stopAudio', () => {

  it('stops audio', () => {
    const context = {
      Tablet: { audio: { is_playing: false, paused_time: 10 } }
    };
    const res = stopAudio({}, context, { role_name: 'Tablet' },
      moment.utc());
    assert.deepEqual(res, [
      {
        operation: 'updatePlayer',
        roleName: 'Tablet',
        updates: {
          values: {
            audio: { $set: null }
          }
        }
      }, {
        operation: 'updateAudio'
      }
    ]);
  });
});
