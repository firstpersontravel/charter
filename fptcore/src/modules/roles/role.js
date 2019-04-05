module.exports = {
  icon: 'user',
  help: {
    summary: 'A role defines a participant in the experience. This participant can be a player, an actor, or a scripted automaton.'
  },
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    actor: { type: 'boolean', default: false },
    user: { type: 'boolean', default: false },
    primary: { type: 'boolean', default: false },
    active_if: { type: 'ifClause' },
    starting_page: { type: 'reference', collection: 'pages' },
    required_values: {
      type: 'list',
      items: { type: 'simpleAttribute', required: true }
    },
    layout: { type: 'reference', collection: 'layouts' }
  }
};
