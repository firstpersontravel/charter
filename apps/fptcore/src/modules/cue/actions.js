var signal_cue = {
  params: {
    cue_name: { required: true, type: 'cue_name' }
  },
  phraseForm: ['cue_name'],
  eventForParams: function(params) {
    return {
      type: 'cue_signaled',
      cue: params.cue_name
    };
  },
  applyAction: function(script, context, params, applyAt) {
    return null;
  }
};

module.exports = {
  signal_cue: signal_cue
};
