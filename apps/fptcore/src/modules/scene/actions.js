var _ = require('lodash');

var start_scene = {
  phraseForm: ['scene_name'],
  eventForParams: function(params) {
    return {
      type: 'scene_started',
      scene: params.scene_name
    };
  },
  params: {
    scene_name: { required: true, type: 'reference', collection: 'scenes' }
  },
  applyAction: function(script, context, params, applyAt) {
    var newSceneName = params.scene_name;
    var newScene = _.find(script.content.scenes, { name: newSceneName });
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
