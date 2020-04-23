const _ = require('lodash');

const Evaluator = require('../utils/evaluator');
const coreRegistry = require('../core-registry');

const evaluator = new Evaluator(coreRegistry);

class SceneCore {
  static getStartingSceneName(scriptContent, actionContext) {
    const firstScene = _.find(scriptContent.scenes || [], function(scene) {
      // Global scenes can not be started.
      if (scene.global) {
        return false;
      }
      return evaluator.if(actionContext, scene.active_if);
    });
    return firstScene && firstScene.name;
  }
}

module.exports = SceneCore;
