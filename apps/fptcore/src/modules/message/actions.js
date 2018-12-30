var _ = require('lodash');

var EvalCore = require('../../cores/eval');

var MESSAGE_TYPE_OPTIONS = ['text', 'image', 'audio'];

var custom_message = {
  params: {
    from_role_name: { required: true, type: 'reference', collection: 'roles' },
    to_role_name: { required: true, type: 'reference', collection: 'roles' },
    message_type: { required: true, type: 'enum', options: MESSAGE_TYPE_OPTIONS },
    message_content: { required: true, type: 'string' },
    location_latitude: { required: false, type: 'number' },
    location_longitude: { required: false, type: 'number' },
    location_accuracy: { required: false, type: 'number' },
    suppress_relay_id: { required: false, type: 'number' }
  },
  phraseForm: [
    'from_role_name', 'to_role_name', 'message_type', 'message_content'
  ],
  eventForParams: function(params) {
    return {
      type: 'message_sent',
      message: {
        from: params.from_role_name,
        to: params.to_role_name,
        type: params.message_type,
        content: params.message_content
      },
      location: {
        latitude: params.location_latitude,
        longitude: params.location_longitude,
        accuracy: params.location_accuracy
      }
    };
  },
  applyAction: function(params, actionContext) {
    var roles = actionContext.scriptContent.roles || [];
    var sentByRole = _.find(roles, { name: params.from_role_name });
    var sentToRole = _.find(roles, { name: params.to_role_name });
    // Messages need replies if they are sent from non-actors to actors.
    var isReplyNeeded = !!sentToRole.actor && !sentByRole.actor;
    return [{
      operation: 'createMessage',
      suppressRelayId: params.suppress_relay_id || null,
      fields: {
        sentById: actionContext.evalContext[params.from_role_name].id,
        sentToId: actionContext.evalContext[params.to_role_name].id,
        createdAt: actionContext.evaluateAt,
        messageType: params.message_type,
        messageContent: params.message_content,
        sentFromLatitude: params.location_latitude || null,
        sentFromLongitude: params.location_longitude || null,
        sentFromAccuracy: params.location_accuracy || null,
        isReplyNeeded: isReplyNeeded,
        isInGallery: params.message_type === 'image'
      }
    }];
  }
};

var send_message = {
  params: {
    message_name: { required: true, type: 'reference', collection: 'messages' },
    to_role_name: { required: false, type: 'reference', collection: 'roles' }
  },
  phraseForm: ['message_name', 'to_role_name'],
  applyAction: function(params, actionContext) {
    var messageName = params.message_name;
    var messageData = _.find(actionContext.scriptContent.messages,
      { name: messageName });
    var messageType = messageData.type;
    var messageContent = EvalCore.templateText(actionContext.evalContext,
      messageData.content, actionContext.timezone);
    var hasBeenRead = messageData.read === true;
    var fromRoleName = messageData.from;
    var toRoleName = params.to_role_name || messageData.to;
    if (!toRoleName) {
      return null;
    }
    return [{
      operation: 'createMessage',
      fields: {
        sentById: actionContext.evalContext[fromRoleName].id,
        sentToId: actionContext.evalContext[toRoleName].id,
        createdAt: actionContext.evaluateAt,
        readAt: hasBeenRead ? actionContext.evaluateAt : null,
        messageName: messageName,
        messageType: messageType,
        messageContent: messageContent
      }
    }];
  }
};

module.exports = {
  custom_message: custom_message,
  send_message: send_message
};
