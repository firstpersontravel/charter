module.exports = {
  cue_signaled: {
    specParams: {
      self: { required: true, type: 'reference', collection: 'cues' }
    },
    matchEvent: function(script, context, spec, event) {
      return spec === event.cue;
    }
  }
};
