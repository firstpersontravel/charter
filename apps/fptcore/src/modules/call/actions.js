var add_to_call = {
  help: { summary: 'Add a player to a conference call.' },
  phraseForm: ['role_name'],
  requiredEventTypes: [
    'call_received', // type: call_received, from: role
    'call_answered'  // type: call_answered, to: role
  ],
  params: {
    role_name: { required: true, type: 'reference', collection: 'roles' }
  },
  applyAction: function (params, actionContext) {
    var evt = actionContext.evalContext.event || {};
    // If triggered by an incoming call
    if (evt.type === 'call_received') {
      return [{
        operation: 'twiml',
        clause: 'dial',
        fromRoleName: evt.from,
        toRoleName: params.role_name
      }];
    }
    // If triggered by an outgoing call
    if (evt.type === 'call_answered') {
      return [{
        operation: 'twiml',
        clause: 'dial',
        fromRoleName: evt.to,
        toRoleName: params.role_name
      }];
    }
  }
};

var initiate_call = {
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
  phraseForm: ['to_role_name', 'as_role_name', 'detect_voicemail'],
  applyAction: function (params, actionContext) {
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
