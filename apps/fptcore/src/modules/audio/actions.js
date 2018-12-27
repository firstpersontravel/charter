var _ = require('lodash');
var moment = require('moment');

var pause_audio = {
  params: {
    role_name: { required: true, type: 'resource', collection: 'roles' }
  },
  phraseForm: ['role_name'],
  applyAction: function(script, context, params, applyAt) {
    if (!context.audio_is_playing) { return null; }

    var startedTime = context.audio_started_time;
    var startedAt = moment.utc(context.audio_started_at);
    var secSinceStarted = applyAt.unix() - startedAt.unix();

    return [{
      operation: 'updateTripValues',
      values: {
        audio_is_playing: false,
        audio_paused_time: startedTime + secSinceStarted
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
      operation: 'updateTripValues',
      values: {
        audio_name: audio.name,
        audio_role: params.role_name,
        audio_path: audio.path,
        audio_started_at: applyAt.toISOString(),
        audio_started_time: 0,
        audio_paused_time: null,
        audio_is_playing: true
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
    if (context.audio_is_playing) {
      return null;
    }
    if (!context.audio_paused_time) {
      return null;
    }
    return [{
      operation: 'updateTripValues',
      values: {
        audio_is_playing: true,
        audio_started_at: applyAt.toISOString(),
        audio_started_time: context.audio_paused_time,
        audio_paused_time: null
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
      operation: 'updateTripValues',
      values: {
        audio_name: null,
        audio_role: null,
        audio_path: null,
        audio_started_at: null,
        audio_started_time: null,
        audio_paused_time: null,
        audio_is_playing: false
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
