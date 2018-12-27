module.exports = {
  specParams: {
    self: { required: true, type: 'cue_name' }
  },
  matchEvent: function(script, context, spec, event) {
    return spec === event.cue;
  }
};
