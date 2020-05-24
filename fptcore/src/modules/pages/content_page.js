module.exports = {
  icon: 'sticky-note',
  title: 'Subpage',
  help: 'A page that can be displayed in a list inside a Content Browse page.',
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
      default: 'tab',
      required: true,
      help: 'A string indicating which a grouping for this content page. The the `content_browse` panel will show all visible content pages grouped by section.'
    },
    title: { type: 'string', required: true },
    active_if: {
      title: 'Visible if',
      type: 'component',
      component: 'conditions',
      help: 'An optional test to determine if the panel is visible or not.'
    },
    panels: {
      type: 'list',
      help: 'List of user interface panels.',
      items: { type: 'component', component: 'panels' }
    }
  }
};
