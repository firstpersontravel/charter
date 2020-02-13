module.exports = {
  icon: 'envelope',
  help: 'An email inbox that you have access to. (This requires some custom setup.)',
  properties: {
    name: { type: 'name', required: true },
    role: {
      type: 'reference',
      collection: 'roles',
      required: true,
      parent: true,
      help: 'Role this inbox belongs to.'
    },
    address: {
      type: 'email',
      required: true,
      help: 'Email address to send from. Currently must be from @firstperson.travel.'
    }
  },
  getTitle: function(scriptContent, spec) {
    return spec.address;
  }
};
