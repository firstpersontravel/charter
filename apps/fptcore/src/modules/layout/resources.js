var SubresourcesRegistry = require('../../registries/subresources');

var LAYOUT_TYPE_VALUES = ['simple', 'tabs'];

var layout = {
  properties: {
    name: { type: 'string', required: true },
    type: { type: 'enum', values: LAYOUT_TYPE_VALUES, required: true },
    section: { type: 'string' },
    header_panels: {
      type: 'list',
      items: { type: 'subresource', class: SubresourcesRegistry.panel }
    }
  },
  validateResource: function(script, resource) {
    if (!resource.type === 'tabs' && !resource.section) {
      return ['Tabs layout resource requires a section.'];
    }
  }
};

module.exports = {
  layout: layout
};
