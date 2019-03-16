var inbox = {
  help: {
    summary: 'An inbox corresponds to an email address that you have access to.'
  },
  properties: {
    name: { type: 'name', required: true },
    role: {
      type: 'reference',
      collection: 'roles',
      required: true,
      parent: true
    },
    address: { type: 'email', required: true }
  },
  getTitle: function(scriptContent, spec) {
    return spec.address;
  },
  getParentClaims: function(resource) {
    return ['roles.' + resource.role];
  }
};

var email = {
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

module.exports = {
  email: email,
  inbox: inbox
};
