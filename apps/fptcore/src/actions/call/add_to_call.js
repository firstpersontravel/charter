function addToCall(script, context, params, applyAt) {
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

addToCall.phraseForm = ['role_name'];

addToCall.requiredContext = [
  'call_received', // type: call_received, from: role
  'call_answered'  // type: call_answered, to: role
];

addToCall.params = {
  role_name: { required: true, type: 'resource', collection: 'roles' }
};

module.exports = addToCall;
