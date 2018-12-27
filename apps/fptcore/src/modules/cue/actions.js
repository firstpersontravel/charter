var signal_cue = {
  params: {
    cue_name: { required: true, type: 'resource', collection: 'cues' }
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
