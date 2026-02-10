module.exports = {
  name: 'scenes',
  resources: {
    scene: {
      resource: require('./scene'),
      actions: {
        start_scene: require('./scene_start')
      },
      events: {
        scene_started: require('./scene_started')
      }
    }
  }
};

export {};
