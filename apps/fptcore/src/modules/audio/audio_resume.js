module.exports = {
  help: { summary: 'Resume currently paused audio.' },
  params: {
    role_name: {
      required: true,
      type: 'reference',
      collection: 'roles',
      display: { primary: true }
    }
  },
  phraseForm: ['role_name'],
  applyAction: function(params, actionContext) {
    if (actionContext.evalContext.audio_is_playing) {
      return null;
    }
    if (!actionContext.evalContext.audio_paused_time) {
      return null;
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
