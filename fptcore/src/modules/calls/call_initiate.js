module.exports = {
  help: { summary: 'Initiate a call from one player to another.' },
  params: {
    to_role_name: {
      required: true,
      type: 'reference',
      collection: 'roles'
    },
    as_role_name: {
      required: true,
      type: 'reference',
      collection: 'roles'
    },
    detect_voicemail: {
      required: false,
      type: 'enum',
      options: ['detect_voicemail'],
      display: { hidden: true }
    }
  },
  applyAction: function (params, actionContext) {
    return [{
      operation: 'initiateCall',
      toRoleName: params.to_role_name,
      asRoleName: params.as_role_name,
      detectVoicemail: params.detect_voicemail === 'detect_voicemail'
    }];
  }
};
