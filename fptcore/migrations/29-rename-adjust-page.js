module.exports = {
  migrations: {
    actions: function(action) {
      if (action.name === 'adjust_page') {
        action.name = 'update_interface';
      }
    }
  },
  tests: [{
    before: {
      triggers: [{
        actions: [
          { name: 'adjust_page' }
        ]
      }]
    },
    after: {
      triggers: [{
        actions: [
          { name: 'update_interface' }
        ]
      }]
    }
  }]
};
