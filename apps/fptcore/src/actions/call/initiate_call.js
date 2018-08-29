function initiateCall(script, context, params, applyAt) {
  return [{
    operation: 'initiateCall',
    toRoleName: params.to_role_name,
    asRoleName: params.as_role_name,
    detectVoicemail: params.detect_voicemail === 'detect_voicemail'
  }];
}

initiateCall.phraseForm = ['to_role_name', 'as_role_name', 'detect_voicemail'];

initiateCall.params = {
  to_role_name: { required: true, type: 'resource', collection: 'roles' },
  as_role_name: { required: true, type: 'resource', collection: 'roles' },
  detect_voicemail: {
    required: false,
    type: 'enum',
    values: ['detect_voicemail']
  }
};

module.exports = initiateCall;
