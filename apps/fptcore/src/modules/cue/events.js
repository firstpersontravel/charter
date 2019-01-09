module.exports = {
  cue_signaled: {
    specParams: {
      cue: { required: true, type: 'reference', collection: 'cues' }
    },
    matchEvent: function(spec, event, actionContext) {
      return spec.cue === event.cue;
    }
  }
};
