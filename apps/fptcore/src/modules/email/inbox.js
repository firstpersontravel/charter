module.exports = {
  icon: 'envelope',
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
