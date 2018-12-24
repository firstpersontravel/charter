var _ = require('lodash');

var EvalCore = require('./eval');

var SceneCore = {};

SceneCore.getStartingSceneName = function(script, context) {
  var firstScene = _.find(script.content.scenes || [], function(scene) {
    // Global scenes can not be started.
    if (scene.global) {
      return false;
    }
    return !scene.if || EvalCore.if(context, scene.if);
  });
  return firstScene && firstScene.name;
};

module.exports = SceneCore;
