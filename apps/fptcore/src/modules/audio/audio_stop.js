module.exports = {
  help: { summary: 'Stop audio and reset audio state.' },
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
    return [{
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
    }];
  }
};
