class SceneCore {
  static sortProp(resource) {
    // Special case to always put scene started trigger first.
    if (resource.event && resource.event.type === 'scene_started') {
      return '';
    }
    return (resource.title || resource.name).toLowerCase();
  }

  static sortResource(a, b) {
    const asort = SceneCore.sortProp(a);
    const bsort = SceneCore.sortProp(b);
    if (asort === bsort) {
      return 0;
    }
    return asort < bsort ? -1 : 1;
  }

  static getStartingSceneName(scriptContent, actionContext) {
    // Global scenes can not be started.
    const sortedScenes = (scriptContent.scenes || [])
      .filter(scene => !scene.global)
      .sort(this.sortResource);
    return sortedScenes[0] && sortedScenes[0].name;
  }
}

module.exports = SceneCore;
