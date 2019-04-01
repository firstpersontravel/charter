var _ = require('lodash');

var EvalCore = require('./eval');

class SceneCore {
  static getStartingSceneName(scriptContent, evalContext) {
    var firstScene = _.find(scriptContent.scenes || [], function(scene) {
      // Global scenes can not be started.
      if (scene.global) {
        return false;
      }
      return !scene.if || EvalCore.if(evalContext, scene.if);
    });
    return firstScene && firstScene.name;
  }
}

module.exports = SceneCore;
