const ROLE_TYPE_OPTIONS = ['traveler', 'performer', 'scripted'];

module.exports = {
  icon: 'user',
  help: 'A participant in the experience. This participant can be a player, an actor, or a scripted automaton.',
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    type: {
      type: 'enum',
      options: ROLE_TYPE_OPTIONS,
      required: true,
      help: 'Type of role. "Traveler" refers to the audience, "performer" can be used for actors or internal staff, and "scripted" is for automated roles that are not assigned users.'
    },
    active_if: { type: 'component', component: 'conditions' },
    starting_page: { type: 'reference', collection: 'pages' },
    required_values: {
      type: 'list',
      items: { type: 'simpleAttribute', required: true }
    },
    layout: { type: 'reference', collection: 'layouts' }
  }
};
