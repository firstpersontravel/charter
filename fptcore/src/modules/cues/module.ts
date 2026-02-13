export default {
  name: 'cues',
  resources: {
    cue: {
      resource: require('./cue').default,
      actions: {
        signal_cue: require('./cue_signal').default
      },
      events: {
        cue_signaled: require('./cue_signaled').default
      }
    }
  }
};

