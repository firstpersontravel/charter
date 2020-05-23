module.exports = {
  name: 'locations',
  resources: {
    geofence: {
      resource: require('./geofence'),
      events: {
        geofence_entered: require('./geofence_entered')
      },
      conditions: require('./geofence_conditions')
    },
    route: {
      resource: require('./route')
    },
    waypoint: {
      resource: require('./waypoint')
    }
  }
};
