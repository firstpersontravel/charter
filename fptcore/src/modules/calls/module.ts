export default {
  name: 'calls',
  resources: {
    call: {
      resource: null, // virtual
      actions: {
        add_to_call: require('./call_add_to').default,
        initiate_call: require('./call_initiate').default,
      },
      events: {
        call_answered: require('./call_answered').default,
        call_received: require('./call_received').default,
        call_ended: require('./call_ended').default
      }
    },
    clip: {
      resource: require('./clip').default,
      actions: {
        play_clip: require('./clip_play').default
      },
      events: {
        clip_answered: require('./clip_answered').default
      },
      conditions: require('./clip_conditions').default
    }
  }
};

