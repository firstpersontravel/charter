var _ = require('lodash');

var MESSAGE_MEDIUM_OPTIONS = ['text', 'image', 'audio'];

module.exports = {
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
        sentByRoleName: params.from_role_name,
        sentToRoleName: params.to_role_name,
        createdAt: actionContext.evaluateAt,
        medium: params.message_medium,
        content: params.message_content,
        sentFromLatitude: params.location_latitude || null,
        sentFromLongitude: params.location_longitude || null,
        sentFromAccuracy: params.location_accuracy || null,
        isReplyNeeded: isReplyNeeded,
        isInGallery: params.message_medium === 'image'
      }
    }, {
      operation: 'event',
      event: {
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
      }
    }];
  }
};
