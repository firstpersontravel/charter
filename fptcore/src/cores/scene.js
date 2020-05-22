class SceneCore {
  static sortResource(a, b) {
    const asort = (a.title || a.name).toLowerCase();
    const bsort = (b.title || b.name).toLowerCase();
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
