var panel = require('./panel');

var LAYOUT_TYPE_OPTIONS = ['simple', 'tabs'];

module.exports = {
  icon: 'mobile-phone',
  help: 'A combination of panels that create a user interface for a tablet, phone, or device.',
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    type: { type: 'enum', options: LAYOUT_TYPE_OPTIONS, required: true },
    section: { type: 'string' },
    header_panels: {
      type: 'list',
      items: { type: 'subresource', class: panel, name: 'panel' }
    }
  },
  validateResource: function(script, resource) {
    if (!resource.type === 'tabs' && !resource.section) {
      return ['Tabs layout resource requires a section.'];
    }
  }
};
