var panels = require('./panels');

var PANEL_COMMON_CLASS = {
  properties: {
    type: {
      type: 'enum',
      options: Object.keys(panels),
      required: true
    },
    active_if: { type: 'ifClause' }
  }
};

var panel = {
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
