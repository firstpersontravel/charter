const _ = require('lodash');

const TextUtil = require('../../utils/text');
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
      help: 'Subject line for the email.'
    },
    body: {
      type: 'markdown',
      required: true,
      help: 'Body of the email.'
    },
    cc: {
      type: 'email',
      help: 'Email address to CC.'
    },
    bcc: {
      type: 'email',
      help: 'Email address to BCC.'
    }
  },
  applyAction: function(params, actionContext) {
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

    const toRole = _.find(actionContext.scriptContent.roles,
      { name: params.to });
    if (!toRole) {
      return [{
        operation: 'log',
        level: 'error',
        message: 'Could not find role named "' + params.to + '".'
      }];
    }

    const toRoleSlug = TextUtil.varForText(toRole.title);
    if (!toRoleSlug) {
      return [{
        operation: 'log',
        level: 'error',
        message: 'Could not generate slug for role "' + params.to + '".'
      }];      
    }
    const toPlayerContext = actionContext.evalContext[toRoleSlug];
    if (!toPlayerContext) {
      return [{
        operation: 'log',
        level: 'error',
        message: 'Could not find player context for "' + toRole.title + '".'
      }];
    }

    if (!toPlayerContext.email) {
      return [{
        operation: 'log',
        level: 'warning',
        message: 'Tried to send email but player "' + toRole.title +
          '" had no email address.'
      }];
    }

    return [{
      operation: 'sendEmail',
      params: {
        from: fromInbox.address,
        to: toPlayerContext.email,
        cc: params.cc,
        bcc: params.bcc,
        subject: subject,
        bodyMarkdown: bodyMarkdown
      }
    }];
  },
  getChildClaims: function(params) {
    return ['emails.' + params.email_name];
  }
};
