var _ = require('lodash');

function customMessage(script, context, params, applyAt) {
  var roles = script.content.roles || [];
  var sentByRole = _.find(roles, { name: params.from_role_name });
  var sentToRole = _.find(roles, { name: params.to_role_name });
  // Messages need replies if they are sent from non-actors to actors.
  var isReplyNeeded = !!sentToRole.actor && !sentByRole.actor;
  return [{
    operation: 'createMessage',
    suppressRelayId: params.suppress_relay_id || null,
    updates: {
      sentById: context[params.from_role_name].id,
      sentToId: context[params.to_role_name].id,
      createdAt: applyAt,
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

customMessage.phraseForm = ['from_role_name', 'to_role_name', 'message_type',
  'message_content'];

customMessage.eventForParams = function(params) {
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
};

customMessage.params = {
  from_role_name: { required: true, type: 'resource', collection: 'roles' },
  to_role_name: { required: true, type: 'resource', collection: 'roles' },
  message_type: {
    required: true,
    type: 'enum',
    values: ['text', 'image', 'audio']
  },
  message_content: { required: true, type: 'string' },
  location_latitude: { required: false, type: 'number' },
  location_longitude: { required: false, type: 'number' },
  location_accuracy: { required: false, type: 'number' },
  suppress_relay_id: { required: false, type: 'number' }
};

module.exports = customMessage;
