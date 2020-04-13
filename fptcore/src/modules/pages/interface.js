const INTERFACE_TYPE_OPTIONS = ['simple', 'tabs'];

module.exports = {
  icon: 'mobile-phone',
  help: 'A combination of panels that create a user interface for a tablet, phone, or device.',
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    type: {
      type: 'enum',
      options: INTERFACE_TYPE_OPTIONS,
      default: 'simple',
      required: true,
      help: 'What type of interface to show. Currently just simple or tabs.'
    },
    section: {
      type: 'string',
      help: 'Section of content pages to use as subpages.'
    },
    header_panels: {
      type: 'list',
      help: 'List of user interface panels to display at the top.',
      items: { type: 'component', component: 'panels' }
    }
  },
  validateResource: function(script, resource) {
    if (!resource.type === 'tabs' && !resource.section) {
      return ['Tabbed interfaces require a section.'];
    }
  }
};
