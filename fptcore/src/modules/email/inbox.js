module.exports = {
  icon: 'envelope',
  help: 'An email inbox that you have access to. (This requires some custom setup.)',
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
