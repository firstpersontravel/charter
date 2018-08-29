var moment = require('moment');

function pauseAudio(script, context, params, applyAt) {
  var participant = context[params.role_name];
  if (!participant.audio || !participant.audio.is_playing) { return null; }

  var startedTime = participant.audio.started_time;
  var startedAt = moment.utc(participant.audio.started_at);
  var secSinceStarted = applyAt.unix() - startedAt.unix();

  return [{
    operation: 'updateParticipant',
    roleName: params.role_name,
    updates: {
      values: {
        audio: {
          is_playing: { $set: false },
          paused_time: { $set: startedTime + secSinceStarted }
        }
      }
    }
  }, {
    operation: 'updateAudio'
  }];
}

pauseAudio.phraseForm = ['role_name'];

pauseAudio.params = {
  role_name: { required: true, type: 'resource', collection: 'roles' }
};

module.exports = pauseAudio;
