var _ = require('lodash');

var EvalCore = require('../../eval');

var sendMessage = {
  applyAction: function(script, context, params, applyAt) {
    var messageName = params.message_name;
    var messageData = _.find(script.content.messages, { name: messageName });
    var messageType = messageData.type;
    var messageContent = EvalCore.templateText(context, messageData.content,
      script.timezone);
    var hasBeenRead = messageData.read === true;
    var fromRoleName = messageData.from;
    var toRoleName = params.to_role_name || messageData.to;
    if (!toRoleName) {
      return null;
    }
    return [{
      operation: 'createMessage',
      updates: {
        sentById: context[fromRoleName].id,
        sentToId: context[toRoleName].id,
        createdAt: applyAt,
        readAt: hasBeenRead ? applyAt : null,
        messageName: messageName,
        messageType: messageType,
        messageContent: messageContent
      }
    }];
  }
};

sendMessage.phraseForm = ['message_name', 'to_role_name'];

sendMessage.params = {
  message_name: { required: true, type: 'resource', collection: 'messages' },
  to_role_name: { required: false, type: 'resource', collection: 'roles' }
};

module.exports = sendMessage;
