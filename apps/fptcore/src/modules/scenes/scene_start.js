var _ = require('lodash');

module.exports = {
  help: { summary: 'Update the current scene.' },
  phraseForm: ['scene_name'],
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
    }, {
      operation: 'event',
      event: {
        type: 'scene_started',
        scene: params.scene_name
      }
    }];
  }
};
