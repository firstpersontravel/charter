export default {
  name: 'locations',
  resources: {
    geofence: {
      resource: require('./geofence').default,
      events: {
        geofence_entered: require('./geofence_entered').default,
        geofence_exited: require('./geofence_exited').default
      },
      conditions: require('./geofence_conditions').default
    },
    route: {
      resource: require('./route').default
    },
    waypoint: {
      resource: require('./waypoint').default
    }
  }
};

