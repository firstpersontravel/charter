function resumeAudio(script, context, params, applyAt) {
  var player = context[params.role_name];
  if (!player.audio || player.audio.is_playing) {
    return null;
  }
  if (!player.audio.paused_time) {
    return null;
  }

  return [{
    operation: 'updatePlayer',
    roleName: params.role_name,
    updates: {
      values: {
        audio: {
          is_playing: { $set: true },
          started_at: { $set: applyAt.toISOString() },
          started_time: { $set: player.audio.paused_time },
          paused_time: { $set: null }
        }
      }
    }
  }, {
    operation: 'updateAudio'
  }];
}

resumeAudio.phraseForm = ['role_name'];

resumeAudio.params = {
  role_name: { required: true, type: 'resource', collection: 'roles' }
};

module.exports = resumeAudio;
