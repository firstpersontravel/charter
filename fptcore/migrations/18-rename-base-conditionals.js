const replacements = {
  istrue: 'value_is_true',
  contains: 'value_contains',
  equals: 'value_equals'
};

module.exports = {
  migrations: {
    conditions: (condition) => {
      if (!condition) {
        return;
      }
      if (replacements[condition.op]) {
        condition.op = replacements[condition.op];
      }
    }
  },
  tests: [{
    before: {
      triggers: [{
        active_if: { op: 'contains', ref: 'a' }
      }, {
        actions: [{
          name: 'conditional',
          if: { op: 'equals', ref: 'a' }
        }]
      }],
      pages: [{
        panels: [{
          type: 'button',
          visible_if: { op: 'istrue', ref: 'a' }
        }]
      }]
    },
    after: {
      triggers: [{
        active_if: { op: 'value_contains', ref: 'a' }
      }, {
        actions: [{
          name: 'conditional',
          if: { op: 'value_equals', ref: 'a' }
        }]
      }],
      pages: [{
        panels: [{
          type: 'button',
          visible_if: { op: 'value_is_true', ref: 'a' }
        }]
      }]
    }
  }]
};
