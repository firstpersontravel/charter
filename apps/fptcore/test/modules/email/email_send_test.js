const _ = require('lodash');
const assert = require('assert');

const send_email = require('../../../src/modules/email/email_send');

describe('#send_email', () => {
  const actionContext = {
    scriptContent: {
      roles: [{ name: 'Player' }, { name: 'System' }],
      inboxes: [{
        name: 'INBOX',
        role: 'System',
        address: 'system@system.com'
      }],
      emails: [{
        name: 'EMAIL',
        from: 'INBOX',
        to: 'Player',
        subject: 'Your {{productName}} is ready!',
        body: 'Your order of {{num}} {{productName}}(s) is ready.'
      }]
    },
    evalContext: {
      Player: { email: 'player@test.com', contact_name: 'The Player' },
      System: { contact_name: 'SYSTEM' },
      productName: 'widget',
      num: 2
    }
  };

  it('sends email', () => {
    const params = { email_name: 'EMAIL' };

    const res = send_email.applyAction(params, actionContext);

    assert.deepStrictEqual(res, [{
      operation: 'sendEmail',
      params: {
        from: 'system@system.com',
        to: 'player@test.com',
        cc: undefined,
        bcc: undefined,
        subject: 'Your widget is ready!',
        bodyMarkdown: 'Your order of 2 widget(s) is ready.'
      }
    }]);
  });

  it('logs eror if email is not found', () => {
    const params = { email_name: 'EMAIL2' };

    const res = send_email.applyAction(params, actionContext);

    assert.deepStrictEqual(res, [{
      operation: 'log',
      level: 'error',
      message: 'Could not find email named "EMAIL2".'
    }]);
  });

  it('logs warning if to email is not present', () => {
    const clonedActionContext = _.cloneDeep(actionContext);
    delete clonedActionContext.evalContext.Player.email;

    const params = { email_name: 'EMAIL' };

    const res = send_email.applyAction(params, clonedActionContext);

    assert.deepStrictEqual(res, [{
      operation: 'log',
      level: 'warning',
      message: 'Tried to send email but player "Player" had no email address.'
    }]);
  });
});
