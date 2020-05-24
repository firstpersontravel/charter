module.exports = {
  icon: 'mobile-phone',
  help: 'A combination of panels that create a user interface for a tablet, phone, or device.',
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    tabs: {
      type: 'list',
      help: 'A list of tabs. If there is only one tab visible, the tabs bar will not be displayed.',
      default: [{ title: 'Main', panels: [{ type: 'current_page' }] }],
      items: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            required: true,
            help: 'The title of this tab.'
          },
          visible_if: {
            type: 'component',
            component: 'conditions',
            help: 'An optional test to determine if the tab is visible or not.'
          },
          panels: {
            type: 'list',
            help: 'List of user interface panels.',
            items: { type: 'component', component: 'panels' }
          }
        }        
      }
    }
  }
};
