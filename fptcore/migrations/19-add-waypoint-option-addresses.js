module.exports = {
  migrations: {
    waypoints: function(waypoint, scriptContent) {
      waypoint.options.forEach(option => {
        if (!option.address) {
          const coords = option.coords;
          option.address = `${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`;
        }
      });
    }
  },
  tests: [{
    before: {
      waypoints: [{
        options: [{
          address: '123 main st',
          coords: [1, 2]
        }, {
          coords: [3, 4]
        }]
      }]
    },
    after: {
      waypoints: [{
        options: [{
          address: '123 main st',
          coords: [1, 2]
        }, {
          address: '3.000000, 4.000000',
          coords: [3, 4]
        }]
      }]
    }
  }]
};
