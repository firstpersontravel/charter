const _ = require('lodash');

const ConditionCore = require('./condition');

class SceneCore {
  static getStartingSceneName(scriptContent, evalContext) {
    const firstScene = _.find(scriptContent.scenes || [], function(scene) {
      // Global scenes can not be started.
      if (scene.global) {
        return false;
      }
      return ConditionCore.if(evalContext, scene.active_if);
    });
    return firstScene && firstScene.name;
  }
}

module.exports = SceneCore;
