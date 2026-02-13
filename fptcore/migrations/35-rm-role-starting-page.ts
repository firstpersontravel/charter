export default {
  migrations: {
    roles: function(role) {
      delete role.starting_page;
    }
  },
  tests: [{
    before: {
      roles: [{
        starting_page: '123'
      }]
    },
    after: {
      roles: [{}]
    }
  }]
};
