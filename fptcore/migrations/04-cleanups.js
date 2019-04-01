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
    },
    // Update complex 'when' clause for actions to 'offset' and 'when'
    actions: function(action) {
      if (!action.when) {
        return;
      }
      var words = action.when.split(/\s+/);
      if (words[0].toLowerCase() === 'in') {
        action.offset = words[1];
        delete action.when;
      } else if (words[0].toLowerCase() === 'at') {
        action.when = words[1].replace('schedule.', '');
      } else if (words[1].toLowerCase() === 'after') {
        action.offset = words[0];
        action.when = words[2].replace('schedule.', '');
      } else if (words[1].toLowerCase() === 'before') {
        action.offset = '-' + words[0];
        action.when = words[2].replace('schedule.', '');
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
        events: [{ type: 'time_occurred', before: '5.4m' }],
        actions: [{ name: 'cue', when: 'at schedule.TIME_THING' }]
      }, {
        events: [{ type: 'cue_signaled' }],
        actions: [{ name: 'cue', when: '10s before schedule.TIME_THING' }]
      }, {
        events: [{ type: 'time_occurred', after: '10s' }],
        actions: [
          { name: 'cue', when: '5.5m after schedule.TIME_THING' },
          { name: 'cue', when: 'in 3d' },
          { name: 'cue' }
        ]
      }]
    },
    after: {
      appearances: [{
        name: 'x'
      }],
      triggers: [{
        events: [{ type: 'time_occurred', offset: '-5.4m' }],
        actions: [{ name: 'cue', when: 'TIME_THING' }]
      }, {
        events: [{ type: 'cue_signaled' }],
        actions: [{ name: 'cue', when: 'TIME_THING', offset: '-10s' }]
      }, {
        events: [{ type: 'time_occurred', offset: '10s' }],
        actions: [
          { name: 'cue', when: 'TIME_THING', offset: '5.5m' },
          { name: 'cue', offset: '3d' },
          { name: 'cue' }
        ]
      }]
    }
  }]
};
