module.exports = {
  icon: 'sticky-note',
  help: 'A section of static text or media that can be displayed in a user interface.',
  properties: {
    name: { type: 'name', required: true },
    interface: {
      type: 'reference',
      collection: 'interfaces',
      required: true,
      parent: true,
      help: 'The parent interface in which this content page is displayed.'
    },
    section: {
      type: 'string',
      required: true,
      help: 'A string indicating which a grouping for this content page. The the `content_browse` panel will show all visible content pages grouped by section.'
    },
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
