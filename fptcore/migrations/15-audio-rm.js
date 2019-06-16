const _ = require('lodash');

module.exports = {
  migrations: {
    actions: function(action, scriptContent) {
      if (action.name === 'play_audio') {
        const audio = _.find(scriptContent.audio, {
          name: action.audio_name
        });
        delete action.audio_name;
        action.path = audio.path;
      }
    },
    scriptContent: function(scriptContent) {
      delete scriptContent.audio;
    }
  },
  tests: [{
    before: {
      audio: [{
        name: 'audio',
        path: 'test.mp3'
      }],
      triggers: [{
        actions: [{
          name: 'play_audio',
          audio_name: 'audio',
          role_name: 'Tablet'
        }]
      }]
    },
    after: {
      triggers: [{
        actions: [{
          name: 'play_audio',
          role_name: 'Tablet',
          path: 'test.mp3'
        }]
      }]
    }
  }]
};
