var _ = require('lodash');

var MESSAGE_MEDIUM_OPTIONS = ['text', 'image', 'audio'];

module.exports = {
  help: { summary: 'Send a text or media message from one player to another.' },
  params: {
    from_role_name: { required: true, type: 'reference', collection: 'roles' },
    to_role_name: { required: true, type: 'reference', collection: 'roles' },
    medium: { required: true, type: 'enum', options: MESSAGE_MEDIUM_OPTIONS },
    content: { required: true, type: 'string' },
    latitude: { required: false, type: 'number', display: { hidden: true } },
    longitude: { required: false, type: 'number', display: { hidden: true } },
    accuracy: { required: false, type: 'number', display: { hidden: true } },
    from_relay_id: { required: false, type: 'number', display: { hidden: true } }
  },
  applyAction: function(params, actionContext) {
    var roles = actionContext.scriptContent.roles || [];
    var sentByRole = _.find(roles, { name: params.from_role_name });
    var sentToRole = _.find(roles, { name: params.to_role_name });
    // Messages need replies if they are sent from non-actors to actors.
    var isReplyNeeded = !!sentToRole.actor && !sentByRole.actor;
    return [{
      operation: 'createMessage',
      suppressRelayId: params.from_relay_id || null,
      fields: {
        sentByRoleName: params.from_role_name,
        sentToRoleName: params.to_role_name,
        createdAt: actionContext.evaluateAt,
        medium: params.medium,
        content: params.content,
        sentFromLatitude: params.latitude || null,
        sentFromLongitude: params.longitude || null,
        sentFromAccuracy: params.accuracy || null,
        isReplyNeeded: isReplyNeeded,
        isInGallery: params.medium === 'image'
      }
    }, {
      operation: 'event',
      event: {
        type: 'message_sent',
        message: {
          from: params.from_role_name,
          to: params.to_role_name,
          medium: params.medium,
          content: params.content
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
