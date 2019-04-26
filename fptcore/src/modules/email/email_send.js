const _ = require('lodash');

const TextUtil = require('../../utils/text');
const TemplateUtil = require('../../utils/template');

module.exports = {
  help: 'Send a pre-defined email from one player to another.',
  params: {
    email_name: {
      required: true,
      type: 'reference',
      collection: 'emails',
      display: { label: false },
      help: 'Predefined email to send.'
    }
  },
  applyAction: function(params, actionContext) {
    const name = params.email_name;
    const emailData = _.find(actionContext.scriptContent.emails, { name: name });
    if (!emailData) {
      return [{
        operation: 'log',
        level: 'error',
        message: 'Could not find email named "' + name + '".'
      }];
    }
    const subject = TemplateUtil.templateText(actionContext.evalContext,
      emailData.subject, actionContext.timezone);
    const bodyMarkdown = TemplateUtil.templateText(actionContext.evalContext,
      emailData.body, actionContext.timezone);

    const fromInbox = _.find(actionContext.scriptContent.inboxes,
      { name: emailData.from });
    if (!fromInbox) {
      return [{
        operation: 'log',
        level: 'error',
        message: 'Could not find inbox named "' + emailData.from + '".'
      }];
    }

    const toRole = _.find(actionContext.scriptContent.roles,
      { name: emailData.to });
    if (!toRole) {
      return [{
        operation: 'log',
        level: 'error',
        message: 'Could not find role named "' + emailData.to + '".'
      }];
    }

    const toRoleSlug = TextUtil.varForText(toRole.title);
    if (!toRoleSlug) {
      return [{
        operation: 'log',
        level: 'error',
        message: 'Could not generate slug for role "' + emailData.to + '".'
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
        cc: emailData.cc,
        bcc: emailData.bcc,
        subject: subject,
        bodyMarkdown: bodyMarkdown
      }
    }];
  },
  getChildClaims: function(params) {
    return ['emails.' + params.email_name];
  }
};
