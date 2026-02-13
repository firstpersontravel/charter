export default {
  migrations: {
    scenes: function(scene) {
      delete scene.active_if;
    }
  },
  tests: [{
    before: {
      scenes: [{
        active_if: 'abc'
      }]
    },
    after: {
      scenes: [{}]
    }
  }]
};
