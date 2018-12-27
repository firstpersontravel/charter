function signalCue(script, context, params, applyAt) {
  return null;
}

signalCue.eventForParams = function(params) {
  return {
    type: 'cue_signaled',
    cue: params.cue_name
  };
};

signalCue.phraseForm = ['cue_name'];

signalCue.params = {
  cue_name: { required: true, type: 'cue_name' }
};

module.exports = signalCue;
