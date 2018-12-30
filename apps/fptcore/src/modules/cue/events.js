module.exports = {
  cue_signaled: {
    specParams: {
      self: { required: true, type: 'reference', collection: 'cues' }
    },
    matchEvent: function(spec, event, actionContext) {
      return spec === event.cue;
    }
  }
};
