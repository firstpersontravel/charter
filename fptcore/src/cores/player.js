var _ = require('lodash');
var moment = require('moment-timezone');

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
    var appearance = _.find(script.content.appearances, { name: page.appearance }) ||
      { name: 'No appearance', title: 'No appearance' };

    var pageTitle = page ? page.title : pageName;
    var appearanceStart = appearance.start ?
      moment.utc(evalContext.schedule[appearance.start]) :
      null;
    return {
      page: page,
      appearance: appearance,
      scene: scene,
      appearanceStart: appearanceStart,
      statusClass: '',
      status: pageTitle
    };
  }

  static getSceneSort(script, evalContext, trip, player) {
    var pageName = trip.tripState.currentPageNamesByRole[player.roleName];
    var page = _.find(script.content.pages, { name: pageName });
    if (!page) {
      return 0;
    }
    var appearance = _.find(script.content.appearances, {
      name: page.appearance
    });
    if (!appearance || !appearance.start) {
      return 0;
    }
    return moment.utc(evalContext.schedule[appearance.start]).unix();
  }
}

module.exports = PlayerCore;
