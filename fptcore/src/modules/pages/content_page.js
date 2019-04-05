var panel = require('./panel');

module.exports = {
  icon: 'sticky-note',
  help: {
    summary: 'A content page is a section of static text or media that can be displayed by a user interface.'
  },
  properties: {
    name: { type: 'name', required: true },
    section: { type: 'string', required: true },
    title: { type: 'string', required: true },
    active_if: { type: 'ifClause' },
    panels: {
      type: 'list',
      required: true,
      items: { type: 'subresource', class: panel }
    }
  }
};
