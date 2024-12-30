module.exports = {
  migrations: {
    roles: function(role) {
      delete role.max_players;
    }
  },
  tests: [{
    before: {
      roles: [
        { name: 'abc', max_players: 3 },
        { name: 'def' },
      ]
    },
    after: {
      roles: [
        { name: 'abc' },
        { name: 'def' },
      ]
    }
  }]
};
