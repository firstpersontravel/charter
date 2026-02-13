import type { ActionContext } from '../../types';
export default {
  help: 'Initiate a call from Charter to a user.',
  params: {
    to_role_name: {
      required: true,
      type: 'reference',
      collection: 'roles',
      help: 'The player to initiate a call to.'
    },
    as_role_name: {
      required: true,
      type: 'reference',
      collection: 'roles',
      help: 'The player from whom the call originates.'
    },
    detect_voicemail: {
      required: false,
      type: 'enum',
      options: ['detect_voicemail'],
      display: { hidden: true }
    }
  },
  getOps(params: Record<string, any>, actionContext: ActionContext) {
    return [{
      operation: 'initiateCall',
      toRoleName: params.to_role_name,
      asRoleName: params.as_role_name,
      detectVoicemail: params.detect_voicemail === 'detect_voicemail'
    }];
  }
};

