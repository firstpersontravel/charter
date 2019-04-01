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
  applyAction: function(params, actionContext) {
    var audio = _.find(actionContext.scriptContent.audio,
      { name: params.audio_name });
    if (!audio) {
      return [{
        operation: 'log',
        level: 'error',
        message: 'Could not find audio named "' + params.audio_name + '".'
      }];
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
