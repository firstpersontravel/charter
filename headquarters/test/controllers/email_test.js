const sinon = require('sinon');

const config = require('../../src/config');
const EmailController = require('../../src/controllers/email');

describe('EmailController', () => {
  describe('#sendEmail', () => {
    it('sends an email', async () => {
      const from = '<name> test@test.com';
      const to = '<name> test2@test2.com';
      const subject = 'Your brand-new email.';
      const body = `# Heading

Your **order** has been _shipped_.

Link: <a href="http://test.com">info</a>.

Yours truly,
FPT
      `;
      await EmailController.sendEmail(from, to, subject, body);

      sinon.assert.calledOnce(config.getSendgridClient().send);
      sinon.assert.calledWith(config.getSendgridClient().send, {
        from: from,
        to: to,
        subject: subject,
        html: `<h1 id="heading">Heading</h1>
<p>Your <strong>order</strong> has been <em>shipped</em>.</p>
<p>Link: <a href="http://test.com">info</a>.</p>
<p>Yours truly,
FPT</p>
`,
        text: `Heading
Your order has been shipped.

Link: <a href="http://test.com">info</a>.

Yours truly,
FPT
`
      });
    });
  });
});
