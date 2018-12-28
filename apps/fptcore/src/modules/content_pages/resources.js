var pageSubresources = require('../page/subresources');

var content_page = {
  properties: {
    name: { type: 'name', required: true },
    section: { type: 'string', required: true },
    title: { type: 'string', required: true },
    if: { type: 'ifClause' },
    panels: { type: 'subresource', class: pageSubresources.panel_list }
  }
};

module.exports = {
  content_page: content_page
};
