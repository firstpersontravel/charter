const TemplateUtil = require('../../utils/template');

module.exports = {
  help: 'Send an image from one player to another.',
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
    image: {
      type: 'media',
      medium: 'image',
      help: 'The content of the message to send.'
    },
    // Special value for indicating that this message is from a player user
    // and needs a reply.
    reply_needed: {
      required: false,
      type: 'boolean',
      display: { hidden: true }
    },
    from_relay_id: { required: false, type: 'number', display: { hidden: true } }
  },
  getOps(params, actionContext) {
    if (!params.image) {
      return [{
        operation: 'log',
        level: 'warn',
        message: 'Tried to send image with no media.'
      }];
    }
    const content = TemplateUtil.templateText(actionContext.evalContext, params.image);
    const isReplyNeeded = !!params.reply_needed;
    return [{
      operation: 'createMessage',
      suppressRelayId: params.from_relay_id || null,
      fields: {
        fromRoleName: params.from_role_name,
        toRoleName: params.to_role_name,
        createdAt: actionContext.evaluateAt,
        medium: 'image',
        content: content,
        isReplyNeeded: isReplyNeeded,
        isInGallery: true
      }
    }, {
      operation: 'event',
      event: {
        type: 'image_received',
        from: params.from_role_name,
        to: params.to_role_name,
        url: content
      }
    }];
  }
};
