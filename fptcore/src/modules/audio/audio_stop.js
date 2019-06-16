module.exports = {
  help: 'Stop audio and reset audio state.',
  params: {
    role_name: {
      required: true,
      type: 'reference',
      collection: 'roles',
      display: { label: false },
      help: 'The role to stop the audio for.'
    }
  },
  applyAction: function(params, actionContext) {
    return [{
      operation: 'updateTripValues',
      values: {
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
