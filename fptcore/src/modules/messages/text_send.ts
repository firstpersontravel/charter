const TemplateUtil = require('../../utils/template');
import type { ActionContext } from '../../types';

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
      help: 'The content of the message to send.',
      display: { multiline: true }
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
  getOps(params: Record<string, any>, actionContext: ActionContext) {
    const content = TemplateUtil.templateText(actionContext.evalContext,
      params.content, actionContext.timezone);
    const isReplyNeeded = !!params.reply_needed;
    return [{
      operation: 'createMessage',
      suppressRelayId: params.from_relay_id || null,
      fields: {
        fromRoleName: params.from_role_name,
        toRoleName: params.to_role_name,
        createdAt: actionContext.evaluateAt,
        medium: 'text',
        content: content,
        isReplyNeeded: isReplyNeeded
      }
    }, {
      operation: 'event',
      event: {
        type: 'text_received',
        from: params.from_role_name,
        to: params.to_role_name,
        content: content,
        message: { content: content } // Keep this for deprecated use
      }
    }];
  }
};

export {};
