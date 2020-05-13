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
    max_players: {
      type: 'integer',
      default: 1,
      help: 'The maximum number of players who may be a part of this trip as this role. This can be used to support groups of more than one player and device, all sharing the same trip state.'
    },
    active_if: {
      type: 'component',
      component: 'conditions',
      help: 'If this is specified, the role will not be allowed to be assigned a user if this condition does not pass.'
    },
    starting_page: {
      type: 'reference',
      collection: 'pages',
      help: 'The page that this role will start the trip open.'
    },
    required_values: {
      type: 'list',
      items: {
        type: 'simpleAttribute',
        required: true,
      },
      help: '(Advanced) Indicates a list of special values that can be supplied for each user account that may play this role. This could be used to specify a custom image for each actor, or custom text associated with a certain role.'
    },
    interface: { type: 'reference', collection: 'interfaces' }
  }
};
