import type { ActionContext } from '../../types';
module.exports = {
  title: 'Stop background audio',
  help: 'Stop audio and reset audio state.',
  params: {
    role_name: {
      required: true,
      type: 'reference',
      collection: 'roles',
      display: { label: false },
      specialValues: [{ value: 'current', label: 'Current' }],
      help: 'The role to stop the audio for.'
    }
  },
  getOps(params: Record<string, any>, actionContext: ActionContext) {
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
    const newAudioStates = Object.assign({},
      actionContext.evalContext.tripState.audioStateByRole, { [roleName]: null });
    const newTripState = Object.assign({},
      actionContext.evalContext.tripState, { audioStateByRole: newAudioStates });

    return [{
      operation: 'updateTripFields',
      fields: { tripState: newTripState }
    }, {
      operation: 'updateAudio'
    }];
  }
};

export {};
