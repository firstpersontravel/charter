function resumeAudio(script, context, params, applyAt) {
  var participant = context[params.role_name];
  if (!participant.audio || participant.audio.is_playing) {
    return null;
  }
  if (!participant.audio.paused_time) {
    return null;
  }

  return [{
    operation: 'updateParticipant',
    roleName: params.role_name,
    updates: {
      values: {
        audio: {
          is_playing: { $set: true },
          started_at: { $set: applyAt.toISOString() },
          started_time: { $set: participant.audio.paused_time },
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
