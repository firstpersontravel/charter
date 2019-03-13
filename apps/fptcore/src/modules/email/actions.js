var _ = require('lodash');

var EvalCore = require('../../cores/eval');

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

    var toRole = _.find(actionContext.scriptContent.roles,
      { name: emailData.to });
    if (!toRole) {
      return null;
    }

    var toPlayer = actionContext.evalContext[toRole.name];
    if (!toPlayer) {
      return null;
    }

    if (!toPlayer.email) {
      return null;
    }

    return [{
      operation: 'sendEmail',
      params: {
        from: emailData.from,
        to: toPlayer.email,
        cc: emailData.cc,
        bcc: emailData.bcc,
        subject: subject,
        bodyMarkdown: bodyMarkdown
      }
    }];
  },
  getChildClaims: function(params) {
    return ['messages.' + params.message_name];
  }
};

module.exports = {
  send_email: send_email
};
