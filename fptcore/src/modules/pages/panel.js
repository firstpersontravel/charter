var panels = require('./panels');

var PANEL_COMMON_CLASS = {
  properties: {
    type: {
      type: 'enum',
      options: Object.keys(panels),
      required: true,
      help: 'The type of panel.'
    },
    active_if: {
      type: 'ifClause',
      help: 'A test to determine if this panel is visible.'
    }
  }
};

var panel = {
  icon: 'sticky-note',
  help: 'A unit of interface with many different options.',
  properties: {
    self: {
      type: 'variegated',
      key: 'type',
      common: PANEL_COMMON_CLASS,
      classes: panels
    }
  }
};

module.exports = panel;
