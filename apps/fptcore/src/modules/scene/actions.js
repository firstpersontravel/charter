var _ = require('lodash');

var start_scene = {
  help: { summary: 'Update the current scene.' },
  phraseForm: ['scene_name'],
  eventForParams: function(params) {
    return {
      type: 'scene_started',
      scene: params.scene_name
    };
  },
  params: {
    scene_name: {
      required: true,
      type: 'reference',
      collection: 'scenes',
      display: { primary: true }
    }
  },
  applyAction: function(params, actionContext) {
    var newSceneName = params.scene_name;
    var newScene = _.find(actionContext.scriptContent.scenes,
      { name: newSceneName });
    if (!newScene) {
      return null;
    }
    // Create updates object
    return [{
      operation: 'updateTripFields',
      fields: { currentSceneName: newSceneName }
    }];
  }
};

module.exports = {
  start_scene: start_scene
};
