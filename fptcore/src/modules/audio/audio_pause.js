var moment = require('moment');

module.exports = {
  help: 'Pause currently playing audio.',
  params: {
    role_name: {
      required: true,
      type: 'reference',
      collection: 'roles',
      display: { label: false },
      help: 'The role to pause the audio for.'
    }
  },
  applyAction: function(params, actionContext) {
    if (!actionContext.evalContext.audio_is_playing) {
      return [{
        operation: 'log',
        level: 'info',
        message: 'Tried to pause audio when none was playing.'
      }];
    }

    var startedTime = actionContext.evalContext.audio_started_time;
    var startedAt = moment.utc(actionContext.evalContext.audio_started_at);
    var secSinceStarted = actionContext.evaluateAt.unix() - startedAt.unix();

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
