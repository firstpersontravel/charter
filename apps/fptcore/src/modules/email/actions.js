var _ = require('lodash');

var EvalCore = require('../../cores/eval');

function decorateEmail(email, name) {
  if (!email) {
    return null;
  }
  if (!name) {
    return email;
  }
  return '"' + name + '" <' + email + '>';
}

var send_email = {
  help: { summary: 'Send a pre-defined email from one player to another.' },
  params: {
    email_name: {
      required: true,
      type: 'reference',
      collection: 'emails',
      display: { primary: true }
    }
  },
  phraseForm: ['email_name'],
  applyAction: function(params, actionContext) {
    var name = params.email_name;
    var emailData = _.find(actionContext.scriptContent.emails, { name: name });
    if (!emailData) {
      return null;
    }
    var subject = EvalCore.templateText(actionContext.evalContext,
      emailData.subject, actionContext.timezone);
    var bodyMarkdown = EvalCore.templateText(actionContext.evalContext,
      emailData.body, actionContext.timezone);

    var fromRole = _.find(actionContext.scriptContent.roles,
      { name: emailData.from });
    var toRole = _.find(actionContext.scriptContent.roles,
      { name: emailData.to });
    if (!fromRole || !toRole) {
      return null;
    }

    var fromPlayer = actionContext.evalContext[fromRole.name];
    var toPlayer = actionContext.evalContext[toRole.name];
    if (!fromPlayer || !toPlayer) {
      return null;
    }

    var fromEmail = decorateEmail(fromPlayer.email, fromPlayer.contact_name);
    var toEmail = decorateEmail(toPlayer.email, toPlayer.contact_name);
    if (!fromEmail || !toEmail) {
      return null;
    }

    return [{
      operation: 'sendEmail',
      from: fromEmail,
      to: toEmail,
      subject: subject,
      bodyMarkdown: bodyMarkdown
    }];
  },
  getChildClaims: function(params) {
    return ['messages.' + params.message_name];
  }
};

module.exports = {
  send_email: send_email
};
