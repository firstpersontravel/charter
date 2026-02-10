module.exports = {
  migrations: {
    relays: function(relay) {
      if (relay.as && relay.as === relay.for) {
        delete relay.as;
      }
    }
  },
  tests: [{
    before: {
      relays: [
        { for: 'gabe', as: 'gabe' },
        { for: 'tom', as: 'phil' },
        { for: 'ted' }
      ]
    },
    after: {
      relays: [
        { for: 'gabe' },
        { for: 'tom', as: 'phil' },
        { for: 'ted' }
      ]
    }
  }]
};
