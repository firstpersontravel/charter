var panel = require('./panel');

module.exports = {
  icon: 'sticky-note',
  help: 'A section of static text or media that can be displayed in a user interface.',
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
