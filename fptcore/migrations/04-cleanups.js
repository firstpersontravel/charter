module.exports = {
  migrations: {
    // Clean up appearances
    appearances: function(appearance) {
      delete appearance.intro;
      delete appearance.if;
      delete appearance.disabled_message;
    }
  },
  tests: [{
    before: {
      appearances: [{
        name: 'x',
        intro: '123',
        if: { op: 'istrue', ref: '12' },
        disabled_message: 'message'
      }]
    },
    after: {
      appearances: [{
        name: 'x'
      }]
    }
  }]
};
