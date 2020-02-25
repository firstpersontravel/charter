module.exports = {
  migrations: {
    cues: function(cue, scriptContent) {
      delete cue.scope;
    }
  },
  tests: [{
    before: {
      cues: [{
        scope: 'hi'
      }]
    },
    after: {
      cues: [{}]
    }
  }]
};
