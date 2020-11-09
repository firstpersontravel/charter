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
    if (!params.audio) {
      return [{
        operation: 'log',
        level: 'warn',
        message: 'Tried to play audio with no media.'       
      }];
    }
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
    const newAudioState = {
      title: params.title,
      url: params.audio,
      startedAt: actionContext.evaluateAt.toISOString(),
      startedTime: 0,
      pausedTime: null,
      isPlaying: true
    };
    const newAudioStates = Object.assign({},
      actionContext.evalContext.tripState.audioStateByRole, {
        [roleName]: newAudioState
      });
    const newTripState = Object.assign({},
      actionContext.evalContext.tripState, {
        audioStateByRole: newAudioStates
      });

    return [{
      operation: 'updateTripFields',
      fields: { tripState: newTripState }
    }, {
      operation: 'updateAudio'
    }];
  }
};
