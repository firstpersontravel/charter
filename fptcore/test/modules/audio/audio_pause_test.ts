const assert = require('assert');
const moment = require('moment');

const pause_audio = require('../../../src/modules/audio/audio_pause').default;

describe('#pause_audio', () => {
  it('logs info if no audio', () => {
    const actionContext = { evalContext: { tripState: {} } };
    const res = pause_audio.getOps({ role_name: 'Tablet' }, actionContext);
    assert.deepStrictEqual(res, [{
      operation: 'log',
      level: 'info',
      message: 'Tried to pause audio when none was playing.'
    }]);
  });

  it('logs info if audio is paused', () => {
    const context = {
      evalContext: { tripState: { audioStateByRole: { Tablet: { isPlaying: false } } } }
    };
    const res = pause_audio.getOps({}, context, { role_name: 'Tablet' }, null);
    assert.deepStrictEqual(res, [{
      operation: 'log',
      level: 'info',
      message: 'Tried to pause audio when none was playing.'
    }]);
  });

  it('pauses and updates value', () => {
    // Audio started a minute ago
    const now = moment.utc();
    const oneMinuteAgo = now.clone().subtract(1, 'minutes').toISOString();
    const actionContext = {
      evalContext: {
        tripState: {
          audioStateByRole: {
            Tablet: { isPlaying: true, startedAt: oneMinuteAgo, startedTime: 10 }
          }
        }
      },
      evaluateAt: now
    };
    const res = pause_audio.getOps({ role_name: 'Tablet' }, actionContext);
    assert.deepStrictEqual(res, [{
      operation: 'updateTripFields',
      fields: {
        tripState: {
          audioStateByRole: {
            Tablet: {
              isPlaying: false,
              pausedTime: 70,
              startedAt: oneMinuteAgo,
              startedTime: 10
            }
          }
        }
      }
    }, {
      operation: 'updateAudio'
    }]);
  });
});
