var _ = require('lodash');

var EvalCore = require('../../cores/eval');

module.exports = {
  help: 'Send a pre-defined message from one player to another.',
  params: {
    message_name: {
      required: true,
      type: 'reference',
      collection: 'messages',
      display: { primary: true },
      help: 'The message to send.'
    },
    to_role_name: {
      required: false,
      type: 'reference',
      collection: 'roles',
      display: { hidden: true }
    }
  },
  applyAction: function(params, actionContext) {
    var name = params.message_name;
    var messageData = _.find(actionContext.scriptContent.messages,
      { name: name });
    if (!messageData) {
      return [{
        operation: 'log',
        level: 'error',
        message: 'Could not find message named "' + name + '".'
      }];
    }
    var medium = messageData.medium;
    var content = EvalCore.templateText(actionContext.evalContext,
      messageData.content, actionContext.timezone);
    var hasBeenRead = messageData.read === true;
    var fromRoleName = messageData.from;
    var toRoleName = params.to_role_name || messageData.to;
    if (!toRoleName) {
      return [{
        operation: 'log',
        level: 'error',
        message: 'Could not find role named "' + toRoleName + '".'
      }];
    }
    return [{
      operation: 'createMessage',
      fields: {
        sentByRoleName: fromRoleName,
        sentToRoleName: toRoleName,
        createdAt: actionContext.evaluateAt,
        readAt: hasBeenRead ? actionContext.evaluateAt : null,
        name: name,
        medium: medium,
        content: content
      }
    }];
  },
  getChildClaims: function(params) {
    return ['messages.' + params.message_name];
  }
};
