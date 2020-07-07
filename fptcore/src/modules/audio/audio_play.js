module.exports = {
  title: 'Play background audio',
  help: 'Start playing audio for a certain role.',
  params: {
    role_name: {
      required: true,
      type: 'reference',
      collection: 'roles',
      display: { label: false },
      help: 'The role to play the audio for.'
    },
    path: {
      type: 'media',
      medium: 'audio',
      help: 'The audio file to play.'
    }
  },
  getOps(params, actionContext) {
    if (!params.path) {
      return [{
        operation: 'log',
        level: 'warn',
        message: 'Tried to play audio with no media.'       
      }];
    }
    return [{
      operation: 'updateTripValues',
      values: {
        audio_role: params.role_name,
        audio_path: params.path,
        audio_started_at: actionContext.evaluateAt.toISOString(),
        audio_started_time: 0,
        audio_paused_time: null,
        audio_is_playing: true
      }
    }, {
      operation: 'updateAudio'
    }];
  }
};
