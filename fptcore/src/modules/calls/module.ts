module.exports = {
  name: 'calls',
  resources: {
    call: {
      resource: null, // virtual
      actions: {
        add_to_call: require('./call_add_to'),
        initiate_call: require('./call_initiate'),
      },
      events: {
        call_answered: require('./call_answered'),
        call_received: require('./call_received'),
        call_ended: require('./call_ended')
      }
    },
    clip: {
      resource: require('./clip'),
      actions: {
        play_clip: require('./clip_play')
      },
      events: {
        clip_answered: require('./clip_answered')
      },
      conditions: require('./clip_conditions')
    }
  }
};

export {};
