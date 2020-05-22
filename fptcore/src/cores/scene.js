const _ = require('lodash');

class SceneCore {
  static getStartingSceneName(scriptContent, actionContext) {
    // Global scenes can not be started.
    const firstScene = _.find(scriptContent.scenes || [],
      scene => !scene.global);
    return firstScene && firstScene.name;
  }
}

module.exports = SceneCore;
