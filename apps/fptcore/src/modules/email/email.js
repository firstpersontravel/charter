module.exports = {
  icon: 'envelope',
  help: {
    summary: 'An email can be sent as part of an experience.'
  },
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    scene: { type: 'reference', collection: 'scenes', required: true },
    subject: { type: 'string', required: true },
    body: { type: 'markdown', required: true },
    from: { type: 'reference', collection: 'inboxes', required: true },
    to: { type: 'reference', collection: 'roles', required: true },
    cc: { type: 'email' },
    bcc: { type: 'email' }
  }
};
