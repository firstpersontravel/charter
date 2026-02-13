export default {
  migrations: {
    panels: function(panel) {
      if (panel.type === 'messages_browse') {
        delete panel.title;
      }
    }
  },
  tests: [{
    before: {
      pages: [{
        panels: [{
          type: 'messages_browse',
          title: 'Messages'
        }]
      }]
    },
    after: {
      pages: [{
        panels: [{
          type: 'messages_browse'
        }]
      }]
    }
  }]
};
