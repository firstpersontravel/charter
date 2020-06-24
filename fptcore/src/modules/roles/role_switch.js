module.exports = {
  help: 'Switch a player from one role to another.',
  params: {
    player_id: {
      required: true,
      type: 'reference',
      collection: 'roles',
      help: 'The player\'s current role to switch from.'
    },
    to_role_name: {
      required: true,
      type: 'reference',
      collection: 'roles',
      help: 'The role to switch the player to.'
    },
  },
  getOps(params, actionContext) {
    return [{
      operation: 'switchRole',
      fields: {
        fromRoleName: params.from_role_name,
        toRoleName: params.to_role_name
      }
    }, {
      operation: 'event',
      event: {
        type: 'role_switched',
        from: params.from_role_name,
        to: params.to_role_name
      }
    }];
  }
};
