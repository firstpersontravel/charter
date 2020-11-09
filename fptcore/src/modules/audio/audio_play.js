module.exports = {
  title: 'Play background audio',
  help: 'Start playing audio for a certain role.',
  params: {
    role_name: {
      required: true,
      type: 'reference',
      collection: 'roles',
      display: { label: false },
      specialValues: [{ value: 'current', label: 'Current' }],
      help: 'The role to play the audio for.'
    },
    audio: {
      type: 'media',
      medium: 'audio',
      help: 'The audio file to play.'
    },
    title: {
      type: 'string',
      help: 'The title to display.'
    }
  },
  getOps(params, actionContext) {
    let roleName = params.role_name;
    if (roleName === 'current') {
      const curRoleName = actionContext.triggeringRoleName;
      if (!curRoleName) {
        return [{
          operation: 'log',
          level: 'error',
          message: 'No current role in event when expected.'
        }];
      }
      roleName = curRoleName;
    }
    if (!params.audio) {
      return [{
        operation: 'log',
        level: 'warn',
        message: 'Tried to play audio with no media.'       
      }];
    }
    return [{
      operation: 'updateTripValues',
      values: {
        audio_role: roleName,
        audio_title: params.title,
        audio_url: params.audio,
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
