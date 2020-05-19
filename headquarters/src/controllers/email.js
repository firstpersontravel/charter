const _ = require('lodash');
const marked = require('marked');
const markedPlainTextRenderer = require('marked-plaintext');

const config = require('../config');

const logger = config.logger.child({ name: 'controllers.email' });

const whitelistedEmails = [
  'gabesmed@yahoo.com',
  'gabe.smedresman@gmail.com',
  'gabe@firstperson.travel',
  'tech@firstperson.travel',
  'agency@firstperson.travel',
  'charter@firstperson.travel'
];

class EmailController {
  static async sendEmail(from, to, subject, bodyMarkdown) {
    const bodyHtml = marked(bodyMarkdown);
    const bodyText = marked(bodyMarkdown, {
      renderer: new markedPlainTextRenderer()
    });
    const sendgridClient = config.getSendgridClient();
    if (!sendgridClient) {
      return null;
    }
    if (!config.isTesting && config.env.STAGE !== 'production') {
      if (!_.some(whitelistedEmails, function(em) {
        return to.indexOf(em) > -1;
      })) {
        logger.warn('Attempted to send email to non-whitelisted address.');
        return null;
      }
    }
    return await sendgridClient.send({
      from: from,
      to: to,
      bcc: 'charter@firstperson.travel',
      subject: subject,
      text: bodyText,
      html: bodyHtml
    });
  }
}

module.exports = EmailController;
