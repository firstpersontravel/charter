export default {
  name: 'scenes',
  resources: {
    scene: {
      resource: require('./scene').default,
      actions: {
        start_scene: require('./scene_start').default
      },
      events: {
        scene_started: require('./scene_started').default
      }
    }
  }
};

