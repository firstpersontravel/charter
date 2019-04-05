module.exports = {
  migrations: {
    eventSpecs: function(eventSpec) {
      if (eventSpec.type === 'scene_started') {
        delete eventSpec.scene;
      }
    },
  },
  tests: [{
    before: {
      triggers: [{
        events: [{ type: 'scene_started', scene: 'abc' }]
      }]
    },
    after: {
      triggers: [{
        events: [{ type: 'scene_started' }]
      }]
    }
  }]
};
