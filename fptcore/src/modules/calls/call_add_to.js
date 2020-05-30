module.exports = {
  help: 'Add a player to a conference call.',
  params: {
    role_name: {
      required: true,
      type: 'reference',
      collection: 'roles',
      help: 'The role to add to the call.'
    }
  },
  getOps(params, actionContext) {
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
