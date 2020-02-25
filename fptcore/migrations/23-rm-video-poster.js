module.exports = {
  migrations: {
    panels: function(panel, scriptContent) {
      if (panel.type === 'video') {
        delete panel.poster;
      }
    }
  },
  tests: [{
    before: {
      pages: [{
        panels: [{
          type: 'video',
          poster: 'hi'
        }]
      }]
    },
    after: {
      pages: [{
        panels: [{ type: 'video' }]
      }]
    }
  }]
};
