export default {
  migrations: {
    waypoints: function(waypoint) {
      for (const opt of waypoint.options) {
        opt.location = { coords: opt.coords };
        if (opt.title) {
          opt.location.title = opt.title;
        }
        if (opt.address) {
          opt.location.address = opt.address;
        }
        delete opt.address;
        delete opt.coords;
        delete opt.title;
      }
    }
  },
  tests: [{
    before: {
      waypoints: [{
        options: [{ address: '123 Main St', coords: [20, 30] }]
      }]
    },
    after: {
      waypoints: [{
        options: [{ location: { address: '123 Main St', coords: [20, 30] } }]
      }]
    }
  }]
};
