module.exports = {
  name: 'cues',
  resources: {
    cue: {
      resource: require('./cue'),
      actions: {
        signal_cue: require('./cue_signal')
      },
      events: {
        cue_signaled: require('./cue_signaled')
      }
    }
  }
};
