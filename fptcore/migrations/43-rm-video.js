module.exports = {
  migrations: {
    pages: function(page) {
      page.panels = page.panels.filter(p => p.type !== 'room');
      return page;
    }
  },
  tests: [{
    before: {
      pages: [{
        panels: [
          { type: 'room', name: 'main' },
          { type: 'text' }
        ]
      }]
    },
    after: {
      pages: [{
        panels: [
          { type: 'text' }
        ]
      }]
    }
  }]
};
