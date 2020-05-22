module.exports = {
  icon: role => {
    if (role) {
      if (role.max_players && role.max_players > 1) {
        return 'group';
      }
      if (!role.interface) {
        return 'user-o';
      }
    }
    return 'user';
  },
  help: 'A participant in the experience. This participant can be a player, an actor, or a scripted automaton.',
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    interface: { type: 'reference', collection: 'interfaces' },
    max_players: {
      type: 'integer',
      default: 1,
      help: 'The maximum number of players who may be a part of this trip as this role. This can be used to support groups of more than one player and device, all sharing the same trip state.'
    },
    starting_page: {
      type: 'reference',
      collection: 'pages',
      help: 'The page that this role will start the trip open.'
    },
    role_values: {
      type: 'list',
      items: {
        type: 'simpleAttribute',
        required: true,
      },
      help: '(Advanced) Indicates a list of special values that can be supplied for each user account that may play this role. This could be used to specify a custom image for each actor, or custom text associated with a certain role.'
    }
  }
};
