module.exports = {
  help: { summary: 'Add a player to a conference call.' },
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
    return [{
      operation: 'log',
      level: 'error',
      message: 'Invalid triggering event "' + (evt.type || 'none') + '".'
    }];
  }
};
