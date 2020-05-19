const _ = require('lodash');

const TemplateUtil = require('../../utils/template');

module.exports = {
  help: 'Send an email from one player to another.',
  params: {
    from: {
      type: 'reference',
      collection: 'inboxes',
      required: true,
      help: 'Inbox to send from.'
    },
    to: {
      type: 'reference',
      collection: 'roles',
      required: true,
      help: 'Role to send to.'
    },
    subject: {
      type: 'string',
      required: true,
      help: 'Subject line for the email.',
      display: { multiline: true }
    },
    body: {
      type: 'markdown',
      required: true,
      help: 'Body of the email.'
    }
  },
  getOps(params, actionContext) {
    const subject = TemplateUtil.templateText(actionContext.evalContext,
      params.subject, actionContext.timezone);
    const bodyMarkdown = TemplateUtil.templateText(actionContext.evalContext,
      params.body, actionContext.timezone);

    const fromInbox = _.find(actionContext.scriptContent.inboxes,
      { name: params.from });
    if (!fromInbox) {
      return [{
        operation: 'log',
        level: 'error',
        message: 'Could not find inbox named "' + params.from + '".'
      }];
    }

    return [{
      operation: 'sendEmail',
      fromEmail: fromInbox.address,
      toRoleName: params.to,
      subject: subject,
      bodyMarkdown: bodyMarkdown
    }];
  }
};
