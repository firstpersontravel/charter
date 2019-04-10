const _ = require('lodash');

const EvalCore = require('../../cores/eval');

const MESSAGE_MEDIUM_OPTIONS = ['text', 'image', 'audio'];

module.exports = {
  help: 'Send a text or media message from one player to another.',
  params: {
    from_role_name: {
      required: true,
      type: 'reference',
      collection: 'roles',
      help: 'The role to send the message from.'
    },
    to_role_name: {
      required: true,
      type: 'reference',
      collection: 'roles',
      help: 'THe role to send the message to.'
    },
    medium: {
      required: true,
      type: 'enum',
      options: MESSAGE_MEDIUM_OPTIONS,
      help: 'What kind of message to send.'
    },
    content: {
      required: true,
      type: 'string',
      help: 'The content of the message to send.'
    },
    latitude: { required: false, type: 'number', display: { hidden: true } },
    longitude: { required: false, type: 'number', display: { hidden: true } },
    accuracy: { required: false, type: 'number', display: { hidden: true } },
    from_relay_id: { required: false, type: 'number', display: { hidden: true } }
  },
  applyAction: function(params, actionContext) {
    const roles = actionContext.scriptContent.roles || [];
    const content = EvalCore.templateText(actionContext.evalContext,
      params.content);
    const sentByRole = _.find(roles, { name: params.from_role_name });
    const sentToRole = _.find(roles, { name: params.to_role_name });
    // Messages need replies if they are sent from non-actors to actors.
    const isReplyNeeded = !!sentToRole.actor && !sentByRole.actor;
    return [{
      operation: 'createMessage',
      suppressRelayId: params.from_relay_id || null,
      fields: {
        sentByRoleName: params.from_role_name,
        sentToRoleName: params.to_role_name,
        createdAt: actionContext.evaluateAt,
        medium: params.medium,
        content: content,
        sentFromLatitude: params.latitude || null,
        sentFromLongitude: params.longitude || null,
        sentFromAccuracy: params.accuracy || null,
        isReplyNeeded: isReplyNeeded,
        isInGallery: params.medium === 'image'
      }
    }, {
      operation: 'event',
      event: {
        type: 'message_received',
        message: {
          from: params.from_role_name,
          to: params.to_role_name,
          medium: params.medium,
          content: content
        },
        location: {
          latitude: params.latitude,
          longitude: params.longitude,
          accuracy: params.accuracy
        }
      }
    }];
  }
};
