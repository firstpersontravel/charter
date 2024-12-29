// Remove all 'room' panels.
function filterPanels(panels) {
  if (!panels) {
    return panels;
  }
  if (panels.filter(p => p.type === 'room') === 0) {
    return panels;
  }
  return panels.filter(p => p.type !== 'room');
}

module.exports = {
  migrations: {
    interfaces: function(interface) {
      if (interface.tabs) {
        for (var tab of interface.tabs) {
          tab.panels = filterPanels(tab.panels);
        }
      }
      return interface;
    },
    pages: function(page) {
      page.panels = filterPanels(page.panels);
      return page;
    },
    content_pages: function(page) {
      page.panels = filterPanels(page.panels);
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
      }],
      content_pages: [{
        panels: [
          { type: 'room', name: 'main' },
          { type: 'text' }
        ]
      }],
      interfaces: [{
        tabs: [{
          panels: [
            { type: 'audio' },
            { type: 'room', name: 'main' }
          ]
        }]
      }]
    },
    after: {
      pages: [{
        panels: [
          { type: 'text' }
        ]
      }],
      content_pages: [{
        panels: [
          { type: 'text' }
        ]
      }],
      interfaces: [{
        tabs: [{
          panels: [
            { type: 'audio' }
          ]
        }]
      }]
    }
  }]
};
