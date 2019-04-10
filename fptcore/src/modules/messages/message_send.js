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
      help: 'If your message does not have a recipient, you can add one here.'
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
  validateResource: function(script, resource) {
    const message = _.find(script.content.messages, {
      name: resource.message_name
    });
    // If not found, message is elsewhere.
    if (!message) {
      return [];
    }
    if (message.to && resource.to_role_name) {
      return [`Message "${message.title}" already has a recipient.`];
    }
    if (!message.to && !resource.to_role_name) {
      return [`Message "${message.title}" has no recipient, so a specific "to" parameter is required.`];
    }
    return [];
  },
  getChildClaims: function(params) {
    return ['messages.' + params.message_name];
  }
};
