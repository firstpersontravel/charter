module.exports = {
  help: 'Change the current player from one role to another.',
  params: {
    to_role_name: {
      required: true,
      type: 'reference',
      collection: 'roles',
      help: 'The role to change the player to.'
    },
  },
  getOps(params, actionContext) {
    return [{
      operation: 'updatePlayerFields',
      playerId: actionContext.currentPlayerId,
      fields: {
        roleName: params.to_role_name
      }
    }, {
      operation: 'event',
      event: {
        type: 'role_changed',
        playerId: actionContext.currentPlayerId,
        toRoleName: params.to_role_name
      }
    }];
  }
};
