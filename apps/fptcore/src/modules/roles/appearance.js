module.exports = {
  help: {
    summary: 'An appearance is an section of involvement of a trip player. It is used to organize different interactions when a user is taking part in multiple trips at the same time.'
  },
  properties: {
    name: { type: 'name', required: true },
    role: {
      type: 'reference',
      collection: 'roles',
      required: true,
      parent: true
    },
    title: { type: 'string', required: true },
    intro: { type: 'string' },
    disabled_message: { type: 'string' },
    start: { type: 'reference', collection: 'times' },
    if: { type: 'ifClause' }
  },
  getParentClaims: function(resource) {
    return ['roles.' + resource.role];
  }
};
