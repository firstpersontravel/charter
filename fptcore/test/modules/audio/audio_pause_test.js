const assert = require('assert');
const moment = require('moment');

const pause_audio = require('../../../src/modules/audio/audio_pause');

describe('#pause_audio', () => {
  it('logs info if no audio', () => {
    const actionContext = { evalContext: {} };
    const res = pause_audio.applyAction(
      { role_name: 'Tablet' }, actionContext);
    assert.deepStrictEqual(res, [{
      operation: 'log',
      level: 'info',
      message: 'Tried to pause audio when none was playing.'
    }]);
  });

  it('logs info if audio is paused', () => {
    const context = { evalContext: { audio_is_playing: false } };
    const res = pause_audio.applyAction(
      {}, context, { role_name: 'Tablet' }, null);
    assert.deepStrictEqual(res, [{
      operation: 'log',
      level: 'info',
      message: 'Tried to pause audio when none was playing.'
    }]);
  });

  it('pauses and updates value', () => {
    // Audio started a minute ago
    const now = moment.utc();
    const actionContext = {
      evalContext: {
        audio_is_playing: true,
        audio_started_at: now.clone().subtract(1, 'minutes').toISOString(),
        audio_started_time: 10
      },
      evaluateAt: now
    };
    const res = pause_audio.applyAction({ role_name: 'Tablet' }, 
      actionContext);
    assert.deepEqual(res, [{
      operation: 'updateTripValues',
      values: {
        audio_is_playing: false,
        audio_paused_time: 70
      }
    }, {
      operation: 'updateAudio'
    }]);
  });
});
