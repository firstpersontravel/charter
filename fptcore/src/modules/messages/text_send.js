const _ = require('lodash');

const TemplateUtil = require('../../utils/template');

module.exports = {
  help: 'Send a text message from one player to another.',
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
      help: 'The role to send the message to.'
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
  getOps(params, actionContext) {
    const roles = actionContext.scriptContent.roles || [];
    const content = TemplateUtil.templateText(actionContext.evalContext,
      params.content);
    const sentByRole = _.find(roles, { name: params.from_role_name });
    const isReplyNeeded = sentByRole.type === 'traveler';
    return [{
      operation: 'createMessage',
      suppressRelayId: params.from_relay_id || null,
      fields: {
        sentByRoleName: params.from_role_name,
        sentToRoleName: params.to_role_name,
        createdAt: actionContext.evaluateAt,
        medium: 'text',
        content: content,
        sentFromLatitude: params.latitude || null,
        sentFromLongitude: params.longitude || null,
        sentFromAccuracy: params.accuracy || null,
        isReplyNeeded: isReplyNeeded,
        isInGallery: false
      }
    }, {
      operation: 'event',
      event: {
        type: 'text_received',
        message: {
          from: params.from_role_name,
          to: params.to_role_name,
          medium: 'text',
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
