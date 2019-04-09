module.exports = {
  icon: 'envelope',
  help: 'An email message for sending from a dedicated inbox to a player with an email address.',
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    scene: { type: 'reference', collection: 'scenes', required: true },
    subject: {
      type: 'string',
      required: true,
      help: 'Subject line for the email.'
    },
    body: {
      type: 'markdown',
      required: true,
      help: 'Body of the email.'
    },
    from: {
      type: 'reference',
      collection: 'inboxes',
      required: true,
      help: 'Inbox to send from.'
    },
    to: {
      type: 'reference',
      collection: 'roles',
      required: true,
      help: 'Role to send to.'
    },
    cc: {
      type: 'email',
      help: 'Email addresses to CC.'
    },
    bcc: {
      type: 'email',
      help: 'Email addresses to BCC.'
    }
  }
};
