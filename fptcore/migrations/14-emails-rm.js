const _ = require('lodash');

module.exports = {
  migrations: {
    actions: function(action, scriptContent) {
      if (action.name === 'send_email') {
        const email = _.find(scriptContent.emails, {
          name: action.email_name
        });
        delete action.email_name;
        action.subject = email.subject;
        action.body = email.body;
        action.from = email.from;
        action.to = email.to;
        action.cc = email.cc;
        action.bcc = email.bcc;
      }
    },
    scriptContent: function(scriptContent) {
      delete scriptContent.emails;
    }
  },
  tests: [{
    before: {
      emails: [{
        name: 'email',
        from: 'from',
        to: 'to',
        subject: 'subj',
        body: 'body',
        cc: 'test@cc.com'
      }],
      triggers: [{
        actions: [{
          name: 'send_email',
          email_name: 'email'
        }]
      }]
    },
    after: {
      triggers: [{
        actions: [{
          name: 'send_email',
          from: 'from',
          to: 'to',
          subject: 'subj',
          body: 'body',
          cc: 'test@cc.com',
          bcc: undefined
        }]
      }]
    }
  }]
};
