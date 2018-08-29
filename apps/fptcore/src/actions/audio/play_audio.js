var _ = require('lodash');

function playAudio(script, context, params, applyAt) {
  var audio = _.find(script.content.audio, { name: params.audio_name });
  if (!audio) {
    return null;
  }

  return [{
    operation: 'updateParticipant',
    roleName: params.role_name,
    updates: {
      values: {
        audio: {
          $set: {
            name: audio.name,
            path: audio.path,
            started_at: applyAt.toISOString(),
            started_time: 0,
            paused_time: null,
            is_playing: true
          }
        }
      }
    }
  }, {
    operation: 'updateAudio'
  }];
}

playAudio.phraseForm = ['role_name', 'audio_name'];

playAudio.params = {
  role_name: { required: true, type: 'resource', collection: 'roles' },
  audio_name: { required: true, type: 'resource', collection: 'audio' }
};

module.exports = playAudio;
