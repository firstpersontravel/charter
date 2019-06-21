const panels = require('./panels');

const PANEL_COMMON_CLASS = {
  properties: {
    type: {
      type: 'enum',
      options: Object.keys(panels),
      required: true,
      help: 'The type of panel.'
    },
    visible_if: {
      type: 'ifClause',
      help: 'A test to determine if this panel is visible.'
    }
  }
};

const panel = {
  type: 'variegated',
  key: 'type',
  common: PANEL_COMMON_CLASS,
  classes: panels
};

module.exports = panel;
