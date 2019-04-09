module.exports = {
  help: 'Resume currently paused audio.',
  params: {
    role_name: {
      required: true,
      type: 'reference',
      collection: 'roles',
      display: { primary: true }
    }
  },
  applyAction: function(params, actionContext) {
    if (actionContext.evalContext.audio_is_playing) {
      return [{
        operation: 'log',
        level: 'warning',
        message: 'Tried to resume audio when audio was already playing.'
      }];
    }
    if (!actionContext.evalContext.audio_paused_time) {
      return [{
        operation: 'log',
        level: 'error',
        message: 'Tried to resume audio when no pause time was available.'
      }];
    }
    return [{
      operation: 'updateTripValues',
      values: {
        audio_is_playing: true,
        audio_started_at: actionContext.evaluateAt.toISOString(),
        audio_started_time: actionContext.evalContext.audio_paused_time,
        audio_paused_time: null
      }
    }, {
      operation: 'updateAudio'
    }];
  }
};
