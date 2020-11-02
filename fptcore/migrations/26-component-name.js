let num = 1;

module.exports = {
  migrations: {
    panels: function(panel, scriptContent) {
      panel.id = num++;
    },
    actions: function(action, scriptContent) {
      action.id = num++;
    }
  },
  tests: [{
    before: {
      pages: [{
        panels: [{}, {}, {}]
      }],
      triggers: [{
        actions: [{
          name: 'conditional',
          actions: [{}],
          else: [{}]
        }]
      }]
    },
    after: {
      pages: [{
        panels: [
          { id: 1 },
          { id: 2 },
          { id: 3 }
        ]
      }],
      triggers: [{
        actions: [{
          id: 4,
          name: 'conditional',
          actions: [{ id: 5 }],
          else: [{  id: 6 }]
        }]
      }]
    }
  }]
};
