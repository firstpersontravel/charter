function move(obj, fromKey, toKey) {
  if (obj[fromKey] !== undefined) {
    obj[toKey] = obj[fromKey];
    delete obj[fromKey];
  }
}

module.exports = {
  migrations: {
    roles: function(role) {
      move(role, 'if', 'active_if');
    },
    scenes: function(scene) {
      move(scene, 'if', 'active_if');
    },
    triggers: function(trigger) {
      move(trigger, 'if', 'active_if');
    },
    content_pages: function(contentPage) {
      move(contentPage, 'if', 'active_if');
    },
    pages: function(page) {
      page.panels.forEach(panel => (
        move(panel, 'if', 'active_if')
      ));
    }
  },
  tests: [{
    before: {
      roles: [{ if: { abc: 'def' }}],
      scenes: [{ if: { abc: 'def' }}],
      triggers: [{ if: { abc: 'def' }}],
      content_pages: [{ if: { abc: 'def' }}],
      pages: [{ panels: [{ if: { abc: 'def' }}] }]
    },
    after: {
      roles: [{ active_if: { abc: 'def' }}],
      scenes: [{ active_if: { abc: 'def' }}],
      triggers: [{ active_if: { abc: 'def' }}],
      content_pages: [{ active_if: { abc: 'def' }}],
      pages: [{ panels: [{ active_if: { abc: 'def' }}] }]
    }
  }]
};
