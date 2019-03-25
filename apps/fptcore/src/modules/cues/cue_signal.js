module.exports = {
  help: { summary: 'Signal a cue.' },
  params: {
    cue_name: {
      required: true,
      type: 'reference',
      collection: 'cues',
      display: { primary: true }
    }
  },
  phraseForm: ['cue_name'],
  applyAction: function(params, actionContext) {
    return [{
      operation: 'event',
      event: { type: 'cue_signaled', cue: params.cue_name }
    }];
  },
  getChildClaims: function(params) {
    // return ['cues.' + params.cue_name];
  }
};
