module.exports = {
  migrations: {
    eventSpecs: function(eventSpec) {
      if (eventSpec.type === 'message_sent') {
        eventSpec.type = 'message_received';
      }
    },
  },
  tests: [{
    before: {
      triggers: [{
        events: [{ type: 'message_sent' }]
      }]
    },
    after: {
      triggers: [{
        events: [{ type: 'message_received' }]
      }]
    }
  }]
};
