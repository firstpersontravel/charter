var SubresourcesRegistry = require('../../registries/subresources');

var content_page = {
  help: {
    summary: 'A content page is a section of static text or media that can be displayed by a user interface.'
  },
  properties: {
    name: { type: 'name', required: true },
    section: { type: 'string', required: true },
    title: { type: 'string', required: true },
    if: { type: 'ifClause' },
    panels: {
      type: 'list',
      required: true,
      items: { type: 'subresource', class: SubresourcesRegistry.panel }
    }
  }
};

module.exports = {
  content_page: content_page
};
