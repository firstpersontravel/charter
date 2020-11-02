var _ = require('lodash');

class PlayerCore {
  static getInitialFields(scriptContent, roleName, variantNames) {
    return {
      roleName: roleName,
      acknowledgedPageName: '',
      acknowledgedPageAt: null
    };
  }

  static getPageInfo(script, evalContext, trip, player) {
    var pageName = trip.tripState.currentPageNamesByRole[player.roleName];
    var page = _.find(script.content.pages, { name: pageName });
    if (!page) {
      return null;
    }
    var scene = _.find(script.content.scenes, { name: page.scene }) ||
      { name: 'No scene', title: 'No scene' };
    var pageTitle = page ? page.title : pageName;
    return {
      page: page,
      scene: scene,
      statusClass: '',
      status: pageTitle
    };
  }

  static getSceneSort(script, evalContext, trip, player) {
    const curSceneName = trip.tripState.currentSceneName;
    const curScene = script.content.scenes.find(s => s.name === curSceneName);
    if (!curScene) {
      return 0;
    }
    return curScene.title;
  }
}

module.exports = PlayerCore;
