module.exports = {
  title: 'Resume background audio',
  help: 'Resume currently paused audio.',
  params: {
    role_name: {
      required: true,
      type: 'reference',
      collection: 'roles',
      display: { label: false },
      specialValues: [{ value: 'current', label: 'Current' }],
      help: 'The role to resume the audio for.'
    }
  },
  getOps(params: any, actionContext: any) {
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

    const currentAudioStates = actionContext.evalContext.tripState.audioStateByRole || {};
    const currentAudioState = currentAudioStates[roleName];
    if (!currentAudioState) {
      return [{
        operation: 'log',
        level: 'error',
        message: 'Tried to resume audio when none was started.'
      }];
    }
    if (currentAudioState.isPlaying) {
      return [{
        operation: 'log',
        level: 'warn',
        message: 'Tried to resume audio when audio was already playing.'
      }];
    }
    if (!currentAudioState.pausedTime) {
      return [{
        operation: 'log',
        level: 'error',
        message: 'Tried to resume audio when no pause time was available.'
      }];
    }
    
    const newAudioState = Object.assign({}, currentAudioState, {
      isPlaying: true,
      startedAt: actionContext.evaluateAt.toISOString(),
      startedTime: currentAudioState.pausedTime,
      pausedTime: null
    });
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

export {};
