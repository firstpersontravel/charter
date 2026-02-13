export default {
  migrations: {
    scriptContent: function(scriptContent) {
      delete scriptContent.checkpoints;
      delete scriptContent.achievements;
    }
  },
  tests: [{
    before: {
      checkpoints: [],
      achievements: []
    },
    after: {}
  }]
};
