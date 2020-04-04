var _ = require('lodash');

module.exports = {
  help: 'Start a new scene.',
  params: {
    scene_name: {
      required: true,
      type: 'reference',
      collection: 'scenes',
      display: { label: false }
    }
  },
  getOps(params, actionContext) {
    var newSceneName = params.scene_name;
    var newScene = _.find(actionContext.scriptContent.scenes,
      { name: newSceneName });
    if (!newScene) {
      return [{
        operation: 'log',
        level: 'error',
        message: 'Could not find scene named "' + newScene + '".'
      }];
    }
    // Create updates object
    const newState = Object.assign({}, actionContext.evalContext.tripState,
      { currentSceneName: newSceneName });
    return [{
      operation: 'updateTripFields',
      fields: { tripState: newState }
    }, {
      operation: 'event',
      event: {
        type: 'scene_started',
        scene: params.scene_name
      }
    }];
  }
};
