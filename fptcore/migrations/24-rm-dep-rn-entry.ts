export default {
  migrations: {
    scriptContent: function(scriptContent) {
      delete scriptContent.departures;
    },
    relays: function(relay) {
      relay.entryway = relay.trailhead;
      delete relay.trailhead;
    }
  },
  tests: [{
    before: {
      departures: [{ id: 1 }],
      relays: [{ trailhead: false }]
    },
    after: {
      relays: [{ entryway: false }]
    }
  }]
};
