const TemplateUtil = require('../../utils/template');

module.exports = {
  help: 'Send an audio message from one player to another.',
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
    audio: {
      type: 'media',
      medium: 'audio',
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
    if (!params.audio) {
      return [{
        operation: 'log',
        level: 'warn',
        message: 'Tried to send audio with no media.'
      }];
    }
    const content = TemplateUtil.templateText(actionContext.evalContext, params.audio);
    const isReplyNeeded = !!params.reply_needed;
    return [{
      operation: 'createMessage',
      suppressRelayId: params.from_relay_id || null,
      fields: {
        fromRoleName: params.from_role_name,
        toRoleName: params.to_role_name,
        createdAt: actionContext.evaluateAt,
        medium: 'audio',
        content: content,
        isReplyNeeded: isReplyNeeded,
        isInGallery: false
      }
    }, {
      operation: 'event',
      event: {
        type: 'audio_received',
        from: params.from_role_name,
        to: params.to_role_name,
        url: content
      }
    }];
  }
};
