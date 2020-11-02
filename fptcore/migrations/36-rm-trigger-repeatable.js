let counter = 0;

function getNewActions(isRepeatable, activeIf, actions) {
  // If not repeatable, add a counter in the test
  if (!isRepeatable) {
    counter += 2;
    // Test if not repeated
    const ifNotRepeated = {
      op: 'not',
      item: { op: 'value_is_true', ref: `counter_${counter - 1}` }
    };
    // Add prev active if if needed
    const newIf = activeIf ?
      { op: 'and', items: [ifNotRepeated, activeIf] } :
      ifNotRepeated;

    // Return conditional and bump the counter
    return [{
      id: 100000 + counter - 1,
      name: 'conditional',
      if: newIf,
      actions: [{
        id: 100000 + counter,
        name: 'set_value',
        value_ref: `counter_${counter - 1}`,
        new_value_ref: 'true'
      }].concat(actions)
    }];
  }
  // If repeatable and have an active if, just
  if (activeIf) {
    counter += 1;
    return [{
      id: 100000 + counter,
      name: 'conditional',
      if: activeIf,
      actions: actions
    }];
  }
  return actions || [];
}

function migrateTrigger(trigger) {
  const isRepeatable = trigger.repeatable !== false;
  const activeIf = trigger.active_if;
  trigger.actions = getNewActions(isRepeatable, activeIf, trigger.actions);
  delete trigger.active_if;
  delete trigger.repeatable;
}

module.exports = {
  migrations: {
    triggers: function(trigger) {
      migrateTrigger(trigger);
    }
  },
  tests: [{
    before: {
      triggers: [
        // Simple repeatable trigger w/no active if
        { actions: [{ op: 1 }] },
        // Trigger with active if
        {
          active_if: { op: 'test', test: 1 },
          actions: [{ id: 2, op: 1 }]
        },
        // Trigger with repeatable
        {
          repeatable: false,
          actions: [{ id: 3, op: 1 }]
        },
        // Trigger with active if and repeatable
        {
          repeatable: false,
          active_if: { op: 'test', test: 2 },
          actions: [{ id: 4, op: 1 }]
        }
      ]
    },
    after: {
      triggers: [
        // Simple repeatable trigger w/no active if
        { actions: [{ op: 1 }] },
        // Trigger with active if
        {
          actions: [{
            id: 100001,
            name: 'conditional',
            if: { op: 'test', test: 1 },
            actions: [{ id: 2, op: 1 }]
          }]
        },
        // Trigger with repeatable
        {
          actions: [{
            id: 100002,
            name: 'conditional',
            if: { op: 'not', item: { op: 'value_is_true', ref: 'counter_2' } },
            actions: [{
              id: 100003,
              name: 'set_value',
              value_ref: 'counter_2',
              new_value_ref: 'true'
            }, { id: 3, op: 1 }
            ]
          }]
        },
        // Trigger with active if and repeatable
        {
          actions: [{
            id: 100004,
            name: 'conditional',
            if: {
              op: 'and',
              items: [
                { op: 'not', item: { op: 'value_is_true', ref: 'counter_4' } },
                { op: 'test', test: 2 }
              ],
            },
            actions: [{
              id: 100005,
              name: 'set_value',
              value_ref: 'counter_4',
              new_value_ref: 'true'
            }, { id: 4, op: 1 }
            ]
          }]
        }
      ]
    }
  }]
};
