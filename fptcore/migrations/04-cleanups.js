module.exports = {
  migrations: {
    // Remove unneeded params from appearances
    appearances: function(appearance) {
      delete appearance.intro;
      delete appearance.if;
      delete appearance.disabled_message;
    },
    // Simplify time references in events to offset
    eventSpecs: function(eventSpec) {
      if (eventSpec.type === 'time_occurred') {
        if (eventSpec.before) {
          eventSpec.offset = '-' + eventSpec.before;
          delete eventSpec.before;
        } else if (eventSpec.after) {
          eventSpec.offset = eventSpec.after;
          delete eventSpec.after;
        }
      }
    }
  },
  tests: [{
    before: {
      appearances: [{
        name: 'x',
        intro: '123',
        if: { op: 'istrue', ref: '12' },
        disabled_message: 'message'
      }],
      triggers: [{
        events: [{ type: 'time_occurred', before: '5.4m' }]
      }, {
        events: [{ type: 'cue_signaled' }]
      }, {
        events: [{ type: 'time_occurred', after: '10s' }]
      }]
    },
    after: {
      appearances: [{
        name: 'x'
      }],
      triggers: [{
        events: [{ type: 'time_occurred', offset: '-5.4m' }]
      }, {
        events: [{ type: 'cue_signaled' }]
      }, {
        events: [{ type: 'time_occurred', offset: '10s' }]
      }]
    }
  }]
};
