var SubresourcesRegistry = require('../../registries/subresources');

var LAYOUT_TYPE_OPTIONS = ['simple', 'tabs'];

var layout = {
  properties: {
    name: { type: 'name', required: true },
    title: { type: 'string', required: true },
    type: { type: 'enum', options: LAYOUT_TYPE_OPTIONS, required: true },
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
