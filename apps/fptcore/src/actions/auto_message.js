var _ = require('lodash');

var EvalCore = require('../eval');

function autoMessage(script, context, params, applyAt) {
  var messageName = params.message_name;
  var messageData = _.find(script.content.messages, { name: messageName });
  var messageType = messageData.type;
  var messageContent = EvalCore.templateText(context, messageData.content,
    script.timezone);
  var hasBeenRead = messageData.read === true;
  return [{
    operation: 'createMessage',
    updates: {
      sentById: context[params.from_role_name].id,
      sentToId: context[params.to_role_name].id,
      createdAt: applyAt,
      readAt: hasBeenRead ? applyAt : null,
      messageName: messageName,
      messageType: messageType,
      messageContent: messageContent
    }
  }];
}

autoMessage.phraseForm = ['from_role_name', 'to_role_name', 'message_name'];

autoMessage.params = {
  from_role_name: { required: true, type: 'resource', collection: 'roles' },
  to_role_name: { required: true, type: 'resource', collection: 'roles' },
  message_name: { required: true, type: 'resource', collection: 'messages' }
};

module.exports = autoMessage;
