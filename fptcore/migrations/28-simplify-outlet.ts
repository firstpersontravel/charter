export default {
  migrations: {
    panels: function(panel) {
      if (panel.type === 'outlet') {
        panel.type = 'current_page';
        delete panel.name;
      }
      if (panel.type === 'text') {
        if (panel.style === 'quest') {
          panel.style = 'banner';
        }
      }
    }
  },
  tests: [{
    before: {
      pages: [{
        panels: [
          { type: 'outlet', name: 'main' },
          { type: 'text', style: 'quest' }
        ]
      }]
    },
    after: {
      pages: [{
        panels: [
          { type: 'current_page' },
          { type: 'text', style: 'banner' }
        ]
      }]
    }
  }]
};
