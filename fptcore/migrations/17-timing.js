module.exports = {
  migrations: {
    triggers: function(trigger, scriptContent) {
      // SUPER SIMPLE migration for timing... just migrate the flat actions
      // conditionals will lose timing data! This means the gamble will be
      // kinda broke...
      const actions = [];
      for (const action of trigger.actions) {
        if (action.when && action.offset && action.offset[0] === '-') {
          actions.push({
            name: 'wait_before_time',
            until: action.when,
            before: action.offset.replace('-', '')
          });
        } else {
          if (action.when) {
            actions.push({ name: 'wait_for_time', until: action.when });
          }
          if (action.offset) {
            actions.push({ name: 'wait', duration: action.offset });
          }
        }
        actions.push(action);
      }
      trigger.actions = actions;
    },
    actions: function(action, scriptContent) {
      delete action.offset;
      delete action.when;
    }
  },
  tests: [{
    before: {
      triggers: [{
        actions: [{ name: 'act1', when: 't' }]
      }, {
        actions: [{ name: 'act2', offset: '20s' }]
      }, {
        actions: [{ name: 'act3', when: 'x', offset: '20m' }]
      }, {
        actions: [{ name: 'act4', when: 'x', offset: '-4h' }]
      }]
    },
    after: {
      triggers: [{
        actions: [
          { name: 'wait_for_time', until: 't' },
          { name: 'act1' }
        ]
      }, {
        actions: [
          { name: 'wait', duration: '20s' },
          { name: 'act2' }
        ]
      }, {
        actions: [
          { name: 'wait_for_time', until: 'x' },
          { name: 'wait', duration: '20m' },
          { name: 'act3' }
        ]
      }, {
        actions: [
          { name: 'wait_before_time', until: 'x', before: '4h' },
          { name: 'act4' }
        ]
      }]
    }
  }]
};
