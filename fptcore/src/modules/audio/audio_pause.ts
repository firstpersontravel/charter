const moment = require('moment');

module.exports = {
  title: 'Pause background audio',
  help: 'Pause currently playing audio.',
  params: {
    role_name: {
      required: true,
      type: 'reference',
      collection: 'roles',
      display: { label: false },
      specialValues: [{ value: 'current', label: 'Current' }],
      help: 'The role to pause the audio for.'
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
    if (!currentAudioState || !currentAudioState.isPlaying) {
      return [{
        operation: 'log',
        level: 'info',
        message: 'Tried to pause audio when none was playing.'
      }];
    }

    const startedTime = currentAudioState.startedTime;
    const startedAt = moment.utc(currentAudioState.startedAt);
    const secSinceStarted = actionContext.evaluateAt.unix() - startedAt.unix();

    const newAudioState = Object.assign({}, currentAudioState, {
      isPlaying: false,
      pausedTime: startedTime + secSinceStarted
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
