var signal_cue = {
  params: {
    cue_name: { required: true, type: 'reference', collection: 'cues' }
  },
  phraseForm: ['cue_name'],
  eventForParams: function(params) {
    return {
      type: 'cue_signaled',
      cue: params.cue_name
    };
  },
  applyAction: function(params, actionContext) {
    return null;
  },
  getChildClaims: function(params) {
    // return ['cues.' + params.cue_name];
  }
};

module.exports = {
  signal_cue: signal_cue
};
