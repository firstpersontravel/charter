var _ = require('lodash');

module.exports = {
  help: { summary: 'Start playing audio for a certain role.' },
  params: {
    role_name: {
      required: true,
      type: 'reference',
      collection: 'roles',
      display: { primary: true }
    },
    audio_name: { required: true, type: 'reference', collection: 'audio' }
  },
  phraseForm: ['role_name', 'audio_name'],
  applyAction: function(params, actionContext) {
    var audio = _.find(actionContext.scriptContent.audio,
      { name: params.audio_name });
    if (!audio) {
      return null;
    }

    return [{
      operation: 'updateTripValues',
      values: {
        audio_name: audio.name,
        audio_role: params.role_name,
        audio_path: audio.path,
        audio_started_at: actionContext.evaluateAt.toISOString(),
        audio_started_time: 0,
        audio_paused_time: null,
        audio_is_playing: true
      }
    }, {
      operation: 'updateAudio'
    }];
  }
};
