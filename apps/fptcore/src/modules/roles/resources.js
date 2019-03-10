var appearance = {
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

var role = {
  help: {
    summary: 'A role defines a participant in the experience. This participant can be a player, an actor, or a scripted automaton.'
  },
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    actor: { type: 'boolean', default: false },
    user: { type: 'boolean', default: false },
    if: { type: 'ifClause' },
    starting_page: { type: 'reference', collection: 'pages' },
    required_values: {
      type: 'list',
      items: { type: 'simpleAttribute', required: true }
    },
    default_layout: { type: 'reference', collection: 'layouts' },
    primary: { type: 'boolean', default: false }
  }
};

module.exports = {
  appearance: appearance,
  role: role
};
