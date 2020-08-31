const INTERFACE_TYPEFACE_OPTIONS = [
  'Arvo',
  'BioRhyme',
  'Courier Prime',
  'Crimson',
  'Inconsolata',
  'Inter',
  'Lora',
  'Montserrat',
  'Playfair',
  'Raleway',
  'Roboto',
  'Source Sans',
  'Work Sans'
];

module.exports = {
  icon: 'mobile',
  help: 'A combination of panels that create a user interface for a tablet, phone, or device.',
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    entryway: {
      type: 'boolean',
      default: false,
      help: 'If set to true, new participants can enter your experience via a webform into this interface.'
    },
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
    },
    background_color: {
      type: 'color',
      default: '#ffffff',
      help: 'Color to use for the background of your interface.'
    },
    header_color: {
      type: 'color',
      default: '#aaaaaa',
      help: 'Color to use for the navigation elements of your interface: the header and tabs.'
    },
    accent_color: {
      title: 'Active color',
      type: 'color',
      default: '#666666',
      help: 'Color to use for active areas like the selected tab.'
    },
    primary_color: {
      type: 'color',
      default: '#aa0000',
      help: 'Color to use for primary actions like buttons.'
    },
    font_family: {
      type: 'enum',
      default: 'Raleway',
      options: INTERFACE_TYPEFACE_OPTIONS,
      help: 'The font family to use for text in your interface.'
    },
    custom_css: {
      type: 'string',
      display: { multiline: true },
      help: 'Supply any custom styles to be inserted into your interface.'
    }
  }
};
