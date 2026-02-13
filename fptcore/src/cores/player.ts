import { find } from '../utils/lodash-replacements';
import type { ScriptContent, Script, EvalContext, Trip, Player, PageInfo } from '../types';

class PlayerCore {
  static getInitialFields(scriptContent: ScriptContent, roleName: string, variantNames: string[]): Pick<Player, 'roleName' | 'acknowledgedPageName' | 'acknowledgedPageAt'> {
    return {
      roleName: roleName,
      acknowledgedPageName: '',
      acknowledgedPageAt: null
    };
  }

  static getPageInfo(script: Script, evalContext: EvalContext, trip: Trip, player: Player): PageInfo | null {
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
      status: pageTitle || ''
    };
  }

  static getSceneSort(script: Script, evalContext: EvalContext, trip: Trip, player: Player): string | number {
    const curSceneName = trip.tripState.currentSceneName;
    const curScene = (script.content.scenes || []).find(s => s.name === curSceneName);
    if (!curScene) {
      return 0;
    }
    return curScene.title || '';
  }
}

export default PlayerCore;
