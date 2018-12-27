var _ = require('lodash');

var startScene = {
  applyAction: function(script, context, params, applyAt) {
    var newSceneName = params.scene_name;
    var newScene = _.find(script.content.scenes || [],
      { name: newSceneName });
    if (!newScene) {
      return null;
    }
    // Create updates object
    var updates = { currentSceneName: { $set: newSceneName } };
    return [{
      operation: 'updateTrip',
      updates: updates
    }];
  }
};

startScene.phraseForm = ['scene_name'];

startScene.eventForParams = function(params) {
  return {
    type: 'scene_started',
    scene: params.scene_name
  };
};

startScene.params = {
  scene_name: { required: true, type: 'resource', collection: 'scenes' }
};

module.exports = startScene;