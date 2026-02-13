const assert = require('assert');

const send_email = require('../../../src/modules/email/email_send').default;

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
        address: 'charter@firstperson.travel'
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
    const res = send_email.getOps(params, actionContext);

    assert.deepStrictEqual(res, [{
      operation: 'sendEmail',
      fromEmail: 'charter@firstperson.travel',
      toRoleName: 'Player',
      subject: 'Your widget is ready!',
      bodyMarkdown: 'Your order of 2 widget(s) is ready.'
    }]);
  });
});
