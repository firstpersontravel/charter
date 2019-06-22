const _ = require('lodash');

const Evaluator = require('../utils/evaluator');
const Registry = require('../registry/registry');

const evaluator = new Evaluator(Registry);

class SceneCore {
  static getStartingSceneName(scriptContent, evalContext) {
    const firstScene = _.find(scriptContent.scenes || [], function(scene) {
      // Global scenes can not be started.
      if (scene.global) {
        return false;
      }
      return evaluator.if(evalContext, scene.active_if);
    });
    return firstScene && firstScene.name;
  }
}

module.exports = SceneCore;
