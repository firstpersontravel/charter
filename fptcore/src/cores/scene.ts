import type { ScriptContent, NamedResource, ActionContext } from '../types';

class SceneCore {
  static sortProp(resource: NamedResource): string {
    // Special case to always put scene started trigger first.
    if ((resource as any).event && (resource as any).event.type === 'scene_started') {
      return '';
    }
    return (resource.title || resource.name).toLowerCase();
  }

  static sortResource(a: NamedResource, b: NamedResource): number {
    const asort = SceneCore.sortProp(a);
    const bsort = SceneCore.sortProp(b);
    if (asort === bsort) {
      return 0;
    }
    return asort < bsort ? -1 : 1;
  }

  static getStartingSceneName(scriptContent: ScriptContent, actionContext: ActionContext): string | undefined {
    // Global scenes can not be started.
    const sortedScenes = (scriptContent.scenes || [])
      .filter(scene => !scene.global)
      .sort(this.sortResource);
    return sortedScenes[0] && sortedScenes[0].name;
  }
}

export default SceneCore;

