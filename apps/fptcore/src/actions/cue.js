function cue(script, context, params, applyAt) {
  return null;
}

cue.eventForParams = function(params) {
  return {
    type: 'cue_signaled',
    cue: params.cue_name
  };
};

cue.phraseForm = ['cue_name'];

cue.params = {
  cue_name: { required: true, type: 'cue_name' }
};

module.exports = cue;
