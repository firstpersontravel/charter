function move(obj, fromKey, toKey) {
  if (obj[fromKey] !== undefined) {
    obj[toKey] = obj[fromKey];
    delete obj[fromKey];
  }
}

module.exports = {
  migrations: {
    content_pages: function(contentPage) {
      (contentPage.panels || []).forEach(panel => (
        move(panel, 'active_if', 'visible_if')
      ));
    },
    layouts: function(layout) {
      (layout.header_panels || []).forEach(panel => (
        move(panel, 'active_if', 'visible_if')
      ));
    },
    pages: function(page) {
      (page.panels || []).forEach(panel => (
        move(panel, 'active_if', 'visible_if')
      ));
    }
  },
  tests: [{
    before: {
      layouts: [{ header_panels: [{ active_if: { abc: 'def' } }] }],
      content_pages: [{ panels: [{ active_if: { abc: 'def' } }] }],
      pages: [{ panels: [{ active_if: { abc: 'def' } }] }]
    },
    after: {
      layouts: [{ header_panels: [{ visible_if: { abc: 'def' } }] }],
      content_pages: [{ panels: [{ visible_if: { abc: 'def' } }] }],
      pages: [{ panels: [{ visible_if: { abc: 'def' } }] }]
    }
  }]
};
