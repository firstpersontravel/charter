module.exports = {
  icon: 'sticky-note',
  help: 'A section of static text or media that can be displayed in a user interface.',
  properties: {
    name: { type: 'name', required: true },
    interface: {
      type: 'reference',
      collection: 'interfaces',
      required: true,
      parent: true
    },
    section: { type: 'string', required: true },
    title: { type: 'string', required: true },
    active_if: {
      type: 'component',
      component: 'conditions',
      help: 'An optional test to determine if the panel is visible or not.'
    },
    panels: {
      type: 'list',
      required: true,
      help: 'List of user interface panels.',
      items: { type: 'component', component: 'panels' }
    }
  }
};
