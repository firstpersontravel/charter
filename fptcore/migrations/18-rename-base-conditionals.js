const replacements = {
  istrue: 'value_is_true',
  contains: 'value_contains',
  equals: 'value_equals'
};

module.exports = {
  migrations: {
    events: (eventSpec) => {
      if (replacements[eventSpec.op]) {
        eventSpec.op = replacements[eventSpec.op];
      }
    }
  },
  tests: [{
    before: {
      triggers: [{
        event: { op: 'contains', ref: 'a' }
      }, {
        event: { op: 'other', ref: 'a' }
      }]
    },
    after: {
      triggers: [{
        event: { op: 'value_contains', ref: 'a' }
      }, {
        event: { op: 'other', ref: 'a' }
      }]
    }
  }]
};
