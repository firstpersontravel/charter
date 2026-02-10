import { find } from '../utils/lodash-replacements';

class PlayerCore {
  static getInitialFields(scriptContent: any, roleName: string, variantNames: string[]): any {
    return {
      roleName: roleName,
      acknowledgedPageName: '',
      acknowledgedPageAt: null
    };
  }

  static getPageInfo(script: any, evalContext: any, trip: any, player: any): any {
    const pageName = trip.tripState.currentPageNamesByRole[player.roleName];
    const page = find(script.content.pages, { name: pageName });
    if (!page) {
      return null;
    }
    const scene = find(script.content.scenes, { name: page.scene }) ||
      { name: 'No scene', title: 'No scene' };
    const pageTitle = page ? page.title : pageName;
    return {
      page: page,
      scene: scene,
      statusClass: '',
      status: pageTitle
    };
  }

  static getSceneSort(script: any, evalContext: any, trip: any, player: any): any {
    const curSceneName = trip.tripState.currentSceneName;
    const curScene = script.content.scenes.find((s: any) => s.name === curSceneName);
    if (!curScene) {
      return 0;
    }
    return curScene.title;
  }
}

module.exports = PlayerCore;
