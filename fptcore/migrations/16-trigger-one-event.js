module.exports = {
  migrations: {
    triggers: function(trigger, scriptContent) {
      const oldEvents = trigger.events;
      trigger.event = trigger.events[0];
      delete trigger.events;
      if (oldEvents.length > 1) {
        let i = 2;
        for (const triggerEvent of oldEvents.slice(1)) {
          scriptContent.triggers.push(Object.assign({}, trigger, {
            event: triggerEvent,
            name: `${trigger.name}-${i++}`
          }));
        }
      }
    },
    scriptContent: function(scriptContent) {
    }
  },
  tests: [{
    before: {
      triggers: [{
        name: 'trigger',
        events: [{ type: 'a' }, { type: 'b' }, { type: 'c' }]
      }, {
        name: 'trigger2',
        events: [{ type: 'd' }]
      }]
    },
    after: {
      triggers: [
        { name: 'trigger', event: { type: 'a' } },
        { name: 'trigger2', event: { type: 'd' } },
        { name: 'trigger-2', event: { type: 'b' } },
        { name: 'trigger-3', event: { type: 'c' } }
      ]
    }
  }]
};
