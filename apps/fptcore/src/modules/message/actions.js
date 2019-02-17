var _ = require('lodash');

var EvalCore = require('../../cores/eval');

var MESSAGE_MEDIUM_OPTIONS = ['text', 'image', 'audio'];

var custom_message = {
  help: { summary: 'Send a text or media message from one player to another.' },
  params: {
    from_role_name: { required: true, type: 'reference', collection: 'roles' },
    to_role_name: { required: true, type: 'reference', collection: 'roles' },
    message_medium: { required: true, type: 'enum', options: MESSAGE_MEDIUM_OPTIONS },
    message_content: { required: true, type: 'string' },
    location_latitude: { required: false, type: 'number', display: { hidden: true } },
    location_longitude: { required: false, type: 'number', display: { hidden: true } },
    location_accuracy: { required: false, type: 'number', display: { hidden: true } },
    suppress_relay_id: { required: false, type: 'number', display: { hidden: true } }
  },
  phraseForm: [
    'from_role_name', 'to_role_name', 'message_medium', 'message_content'
  ],
  eventForParams: function(params) {
    return {
      type: 'message_sent',
      message: {
        from: params.from_role_name,
        to: params.to_role_name,
        medium: params.message_medium,
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
        medium: params.message_medium,
        content: params.message_content,
        sentFromLatitude: params.location_latitude || null,
        sentFromLongitude: params.location_longitude || null,
        sentFromAccuracy: params.location_accuracy || null,
        isReplyNeeded: isReplyNeeded,
        isInGallery: params.message_medium === 'image'
      }
    }];
  }
};

var send_message = {
  help: { summary: 'Send a pre-defined message from one player to another.' },
  params: {
    message_name: {
      required: true,
      type: 'reference',
      collection: 'messages',
      display: { primary: true }
    },
    to_role_name: {
      required: false,
      type: 'reference',
      collection: 'roles',
      display: { hidden: true }
    }
  },
  phraseForm: ['message_name', 'to_role_name'],
  applyAction: function(params, actionContext) {
    var name = params.message_name;
    var messageData = _.find(actionContext.scriptContent.messages,
      { name: name });
    if (!messageData) {
      return null;
    }
    var medium = messageData.medium;
    var content = EvalCore.templateText(actionContext.evalContext,
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

module.exports = {
  custom_message: custom_message,
  send_message: send_message
};
