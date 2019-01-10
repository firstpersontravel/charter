module.exports = {
  cue_signaled: {
    title: function(spec) {
      return 'cue_signaled ' + spec.cue;
    },
    specParams: {
      cue: { required: true, type: 'reference', collection: 'cues' }
    },
    matchEvent: function(spec, event, actionContext) {
      return spec.cue === event.cue;
    }
  }
};
