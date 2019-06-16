const _ = require('lodash');
const assert = require('assert');

const send_email = require('../../../src/modules/email/email_send');

describe('#send_email', () => {
  const actionContext = {
    scriptContent: {
      roles: [
        { name: 'Player', title: 'Player', },
        { name: 'System', title: 'System' }
      ],
      inboxes: [{
        name: 'INBOX',
        role: 'System',
        address: 'system@system.com'
      }]
    },
    evalContext: {
      player: { email: 'player@test.com', contact_name: 'The Player' },
      system: { contact_name: 'SYSTEM' },
      productName: 'widget',
      num: 2
    }
  };

  const params = {
    from: 'INBOX',
    to: 'Player',
    subject: 'Your {{productName}} is ready!',
    body: 'Your order of {{num}} {{productName}}(s) is ready.'
  };

  it('sends email', () => {
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

  it('logs warning if to email is not present', () => {
    const clonedActionContext = _.cloneDeep(actionContext);
    delete clonedActionContext.evalContext.player.email;

    const res = send_email.applyAction(params, clonedActionContext);

    assert.deepStrictEqual(res, [{
      operation: 'log',
      level: 'warning',
      message: 'Tried to send email but player "Player" had no email address.'
    }]);
  });
});
