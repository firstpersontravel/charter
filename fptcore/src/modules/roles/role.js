module.exports = {
  icon: role => {
    if (role && role.max_players && role.max_players > 1) {
      return 'group';
    }
    return 'user';
  },
  help: 'A participant in the experience. This participant can be a player, an actor, or a scripted automaton.',
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    interface: { type: 'reference', collection: 'interfaces' },
    max_players: {
      title: 'Max users',
      type: 'integer',
      default: 1,
      help: 'The maximum number of users who may be a part of this trip as this role. This can be used to support groups of more than one player and device, all sharing the same trip state.'
    },
    role_values: {
      title: 'Role variable names',
      type: 'list',
      items: {
        type: 'simpleAttribute',
        required: true,
      },
      help: '(Advanced) Indicates a list of special variables that can be supplied for each user account that may play this role. This could be used to specify a custom image for each actor, or custom text associated with a certain role.'
    }
  }
};
