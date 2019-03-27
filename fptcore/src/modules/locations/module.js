module.exports = {
  resources: {
    geofence: {
      resource: require('./geofence'),
      events: {
        geofence_entered: require('./geofence_entered')
      }
    },
    route: {
      resource: require('./route')
    },
    waypoint: {
      resource: require('./waypoint')
    }
  }
};
