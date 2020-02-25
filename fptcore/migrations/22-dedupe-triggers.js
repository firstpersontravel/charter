let names = new Set();
let uid = 1;

module.exports = {
  migrations: {
    scriptContent: function(scriptContent) {
      // reset
      uid = 1;
      names = new Set();
    },
    triggers: function(trigger, scriptContent) {
      if (names.has(trigger.name)) {
        trigger.name = `deduped-${uid++}`;
      }
      names.add(trigger.name);
    }
  },
  tests: [{
    before: {
      triggers: [{
        name: 'trigger'
      }, {
        name: 'trigger'
      }]
    },
    after: {
      triggers: [{
        name: 'trigger'
      }, {
        name: 'deduped-1'
      }]
    }
  }, {
    before: {
      triggers: [{
        name: 'diffscript'
      }, {
        name: 'diffscript'
      }]
    },
    after: {
      triggers: [{
        name: 'diffscript'
      }, {
        name: 'deduped-1'
      }]
    }
  }]
};
