const _ = require('lodash');

module.exports = {
  help: 'Occurs when a player exits a geofenced region.',
  specParams: {
    role: {
      required: true,
      type: 'reference',
      collection: 'roles',
      display: { label: false },
      help: 'The role exiting the geofence.'
    },
    geofence: {
      required: true,
      type: 'reference',
      collection: 'geofences',
      help: 'The geofence being exited.'
    }
  },
  matchEvent: function(spec, event, actionContext) {
    return (
      spec.geofence === event.geofence &&
      spec.role === event.role
    );
  },
  getTitle: function(scriptContent, resource, registry) {
    const role = _.find(scriptContent.roles, { name: resource.role });
    const geofence = _.find(scriptContent.geofences, { name: resource.geofence });
    const waypoint = geofence ? _.find(scriptContent.waypoints, { name: geofence.center }) : null;
    return `${role ? role.title : 'unknown'} exited "${waypoint ? waypoint.title : 'unknown'}"`;
  }
};
