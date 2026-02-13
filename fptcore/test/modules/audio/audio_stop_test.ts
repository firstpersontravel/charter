const assert = require('assert');
const moment = require('moment');

const stop_audio = require('../../../src/modules/audio/audio_stop').default;

describe('#stop_audio', () => {
  it('stops audio', () => {
    const params = { role_name: 'Tablet' };
    const actionContext = {
      scriptContent: {},
      evalContext: {
        tripState: {
          audioStateByRole: {
            existing: { isPlaying: true },
            Tablet: { isPlaying: false, pausedTime: 10 }
          }
        }
      },
      evaluateAt: moment.utc()
    };
    const res = stop_audio.getOps(params, actionContext);
    assert.deepStrictEqual(res, [
      {
        operation: 'updateTripFields',
        fields: {
          tripState: {
            audioStateByRole: {
              existing: { isPlaying: true },
              Tablet: null
            }
          }
        }
      }, {
        operation: 'updateAudio'
      }
    ]);
  });
});
