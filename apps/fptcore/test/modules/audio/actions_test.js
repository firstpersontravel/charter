const assert = require('assert');
const moment = require('moment');

const audioActions = require('../../../src/modules/audio/actions');

describe('#pause_audio', () => {
  it('does nothing if no audio', () => {
    const actionContext = { evalContext: {} };
    const res = audioActions.pause_audio.applyAction(
      { role_name: 'Tablet' }, actionContext);
    assert.strictEqual(res, null);
  });

  it('does nothing if audio is paused', () => {
    const context = { evalContext: { audio_is_playing: false } };
    const res = audioActions.pause_audio.applyAction(
      {}, context, { role_name: 'Tablet' }, null);
    assert.strictEqual(res, null);
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
    const res = audioActions.pause_audio.applyAction({ role_name: 'Tablet' }, 
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

describe('#play_audio', () => {
  const now = moment.utc();
  const scriptContent = {
    audio: [{
      name: 'AUDIO-1',
      path: 'audio/audio.mp3',
      duration: 120
    }]
  };

  it('does nothing if audio not found', () => {
    const params = { role_name: 'Tablet', audio_name: 'AUDIO-3' };
    const actionContext = {
      scriptContent: scriptContent,
      evalContext: { audio_is_playing: false },
      evaluateAt: now
    };
    const res = audioActions.play_audio.applyAction(params, actionContext);
    assert.strictEqual(res, null);
  });

  it('plays audio', () => {
    const params = { role_name: 'Tablet', audio_name: 'AUDIO-1' };
    const actionContext = {
      scriptContent: scriptContent,
      evalContext: { audio_is_playing: false },
      evaluateAt: now
    };
    const res = audioActions.play_audio.applyAction(params, actionContext);
    assert.deepEqual(res, [
      {
        operation: 'updateTripValues',
        values: {
          audio_name: 'AUDIO-1',
          audio_role: 'Tablet',
          audio_path: 'audio/audio.mp3',
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

describe('#resume_audio', () => {
  const now = moment.utc();
  const scriptContent = {
    audio: [{
      name: 'AUDIO-1',
      path: 'audio/audio.mp3',
      duration: 120
    }]
  };

  it('does nothing if not started', () => {
    const params = { role_name: 'Tablet' };
    const actionContext = {
      scriptContent: scriptContent,
      evalContext: {},
      evaluateAt: now
    };
    const res = audioActions.resume_audio.applyAction(params, actionContext);
    assert.strictEqual(res, null);
  });

  it('does nothing if playing', () => {
    const params = { role_name: 'Tablet' };
    const actionContext = {
      scriptContent: scriptContent,
      evalContext: { audio_is_playing: true },
      evaluateAt: now
    };
    const res = audioActions.resume_audio.applyAction(params, actionContext);
    assert.strictEqual(res, null);
  });

  it('resume audio', () => {
    const params = { role_name: 'Tablet' };
    const actionContext = {
      scriptContent: scriptContent,
      evalContext: { audio_is_playing: false, audio_paused_time: 10 },
      evaluateAt: now
    };
    const res = audioActions.resume_audio.applyAction(params, actionContext);
    assert.deepEqual(res, [
      {
        operation: 'updateTripValues',
        values: {
          audio_is_playing: true,
          audio_started_at: now.toISOString(),
          audio_started_time: 10,
          audio_paused_time: null
        }
      }, {
        operation: 'updateAudio'
      }
    ]);
  });
});

describe('#stop_audio', () => {
  it('stops audio', () => {
    const params = { role_name: 'Tablet' };
    const actionContext = {
      scriptContent: {},
      evalContext: { audio_is_playing: false, audio_paused_time: 10 },
      evaluateAt: moment.utc()
    };
    const res = audioActions.stop_audio.applyAction(params, actionContext);
    assert.deepEqual(res, [
      {
        operation: 'updateTripValues',
        values: {
          audio_name: null,
          audio_role: null,
          audio_path: null,
          audio_started_at: null,
          audio_started_time: null,
          audio_paused_time: null,
          audio_is_playing: false
        }
      }, {
        operation: 'updateAudio'
      }
    ]);
  });
});
