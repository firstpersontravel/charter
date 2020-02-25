const statue = {
  address: 'Statue of Liberty',
  coords: [40.689201, -74.044500],
  name: 'statue',
  title: 'Statue of Liberty',
  values: {}
};

module.exports = {
  migrations: {
    waypoints: function(waypoint, scriptContent) {
      if (!waypoint.options || !waypoint.options.length) {
        waypoint.options = [statue];
      }
    }
  },
  tests: [{
    before: {
      waypoints: [{
        options: []
      }]
    },
    after: {
      waypoints: [{
        options: [statue]
      }]
    }
  }]
};
