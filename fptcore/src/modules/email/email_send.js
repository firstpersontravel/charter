var _ = require('lodash');

var ContextCore = require('../../cores/context');
var EvalCore = require('../../cores/eval');

module.exports = {
  help: { summary: 'Send a pre-defined email from one player to another.' },
  params: {
    email_name: {
      required: true,
      type: 'reference',
      collection: 'emails',
      display: { primary: true }
    }
  },
  applyAction: function(params, actionContext) {
    var name = params.email_name;
    var emailData = _.find(actionContext.scriptContent.emails, { name: name });
    if (!emailData) {
      return [{
        operation: 'log',
        level: 'error',
        message: 'Could not find email named "' + name + '".'
      }];
    }
    var subject = EvalCore.templateText(actionContext.evalContext,
      emailData.subject, actionContext.timezone);
    var bodyMarkdown = EvalCore.templateText(actionContext.evalContext,
      emailData.body, actionContext.timezone);

    var fromInbox = _.find(actionContext.scriptContent.inboxes,
      { name: emailData.from });
    if (!fromInbox) {
      return [{
        operation: 'log',
        level: 'error',
        message: 'Could not find inbox named "' + emailData.from + '".'
      }];
    }

    var toRole = _.find(actionContext.scriptContent.roles,
      { name: emailData.to });
    if (!toRole) {
      return [{
        operation: 'log',
        level: 'error',
        message: 'Could not find role named "' + emailData.to + '".'
      }];
    }

    var toRoleSlug = ContextCore.slugForRole(toRole);
    if (!toRoleSlug) {
      return [{
        operation: 'log',
        level: 'error',
        message: 'Could not generate slug for role "' + emailData.to + '".'
      }];      
    }
    var toPlayerContext = actionContext.evalContext[toRoleSlug];
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
