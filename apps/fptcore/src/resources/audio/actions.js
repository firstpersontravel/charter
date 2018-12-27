var _ = require('lodash');
var moment = require('moment');

var pause_audio = {
  params: {
    role_name: { required: true, type: 'resource', collection: 'roles' }
  },
  phraseForm: ['role_name'],
  applyAction: function(script, context, params, applyAt) {
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
};

var play_audio = {
  params: {
    role_name: { required: true, type: 'resource', collection: 'roles' },
    audio_name: { required: true, type: 'resource', collection: 'audio' }
  },
  phraseForm: ['role_name', 'audio_name'],
  applyAction: function(script, context, params, applyAt) {
    var audio = _.find(script.content.audio, { name: params.audio_name });
    if (!audio) {
      return null;
    }

    return [{
      operation: 'updatePlayer',
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
};

var resume_audio = {
  params: {
    role_name: { required: true, type: 'resource', collection: 'roles' }
  },
  phraseForm: ['role_name'],
  applyAction: function(script, context, params, applyAt) {
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
};

var stop_audio = {
  params: {
    role_name: { required: true, type: 'resource', collection: 'roles' }
  },
  phraseForm: ['role_name'],
  applyAction: function(script, context, params, applyAt) {
    return [{
      operation: 'updatePlayer',
      roleName: params.role_name,
      updates: {
        values: {
          audio: {
            $set: null
          }
        }
      }
    }, {
      operation: 'updateAudio'
    }];
  }
};

module.exports = {
  pause_audio: pause_audio,
  play_audio: play_audio,
  resume_audio: resume_audio,
  stop_audio: stop_audio
};
