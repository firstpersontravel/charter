var add_to_call = {
  phraseForm: ['role_name'],
  requiredEventTypes: [
    'call_received', // type: call_received, from: role
    'call_answered'  // type: call_answered, to: role
  ],
  params: {
    role_name: { required: true, type: 'reference', collection: 'roles' }
  },
  applyAction: function (script, context, params, applyAt) {
    // If triggered by an incoming call
    if (context.event.type === 'call_received') {
      return [{
        operation: 'twiml',
        clause: 'dial',
        fromRoleName: context.event.from,
        toRoleName: params.role_name
      }];
    }
    // If triggered by an outgoing call
    if (context.event.type === 'call_answered') {
      return [{
        operation: 'twiml',
        clause: 'dial',
        fromRoleName: context.event.to,
        toRoleName: params.role_name
      }];
    }
  }
};

var initiate_call = {
  params: {
    to_role_name: { required: true, type: 'reference', collection: 'roles' },
    as_role_name: { required: true, type: 'reference', collection: 'roles' },
    detect_voicemail: {
      required: false,
      type: 'enum',
      options: ['detect_voicemail']
    }
  },
  phraseForm: ['to_role_name', 'as_role_name', 'detect_voicemail'],
  applyAction: function (script, context, params, applyAt) {
    return [{
      operation: 'initiateCall',
      toRoleName: params.to_role_name,
      asRoleName: params.as_role_name,
      detectVoicemail: params.detect_voicemail === 'detect_voicemail'
    }];
  }
};

module.exports = {
  add_to_call: add_to_call,
  initiate_call: initiate_call
};
