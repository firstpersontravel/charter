class SceneCore {
  static sortProp(resource: any): string {
    // Special case to always put scene started trigger first.
    if (resource.event && resource.event.type === 'scene_started') {
      return '';
    }
    return (resource.title || resource.name).toLowerCase();
  }

  static sortResource(a: any, b: any): number {
    const asort = SceneCore.sortProp(a);
    const bsort = SceneCore.sortProp(b);
    if (asort === bsort) {
      return 0;
    }
    return asort < bsort ? -1 : 1;
  }

  static getStartingSceneName(scriptContent: any, actionContext: any): string | undefined {
    // Global scenes can not be started.
    const sortedScenes = (scriptContent.scenes || [])
      .filter((scene: any) => !scene.global)
      .sort(this.sortResource);
    return sortedScenes[0] && sortedScenes[0].name;
  }
}

module.exports = SceneCore;

export {};
