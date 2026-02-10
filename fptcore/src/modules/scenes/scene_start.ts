import { find } from '../../utils/lodash-replacements';

const SceneCore = require('../../cores/scene');

module.exports = {
  help: 'Start a new scene.',
  params: {
    scene_name: {
      required: true,
      type: 'reference',
      collection: 'scenes',
      display: { label: false },
      help: 'The scene to start.'
    }
  },
  getOps(params: any, actionContext: any) {
    const scriptContent = actionContext.scriptContent;
    var newSceneName = params.scene_name;
    var newScene = find(scriptContent.scenes,
      { name: newSceneName });
    if (!newScene) {
      return [{
        operation: 'log',
        level: 'error',
        message: 'Could not find scene named "' + newScene + '".'
      }];
    }
    // Don't change scene if it's alreeady current.
    const curTripState = actionContext.evalContext.tripState;
    if (newSceneName === curTripState.currentSceneName) {
      return [];
    }
    // Can't set current scene to a global one.
    if (newScene.global) {
      return [];
    }
    // Create updates for player pages
    const newPageNamesByRole = {};
    for (const role of scriptContent.roles || []) {
      if (!role.interface) {
        continue;
      }
      // By default, remove players' current page, since we're changing scene.
      // If there is a new page for that player in this scene, then auto-nav
      // to the first one sorted by name.
      const pagesForRole = (scriptContent.pages || [])
        .filter(p => (
          p.interface === role.interface && p.scene === newSceneName
        ))
        .sort(SceneCore.sortResource);
      if (pagesForRole.length) {
        newPageNamesByRole[role.name] = pagesForRole[0].name;
      }
    }
    // Create updates object for trip state
    const newState = Object.assign({}, curTripState, {
      currentSceneName: newSceneName,
      currentPageNamesByRole: newPageNamesByRole
    });
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
