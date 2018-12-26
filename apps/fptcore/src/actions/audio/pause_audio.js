var moment = require('moment');

function pauseAudio(script, context, params, applyAt) {
  var player = context[params.role_name];
  if (!player.audio || !player.audio.is_playing) { return null; }

  var startedTime = player.audio.started_time;
  var startedAt = moment.utc(player.audio.started_at);
  var secSinceStarted = applyAt.unix() - startedAt.unix();

  return [{
    operation: 'updatePlayer',
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
