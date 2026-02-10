import { find } from '../../utils/lodash-replacements';

module.exports = {
  help: 'Occurs when a player enters a geofenced region.',
  specParams: {
    role: {
      required: true,
      type: 'reference',
      collection: 'roles',
      display: { label: false },
      help: 'The role entering the geofence.'
    },
    geofence: {
      required: true,
      type: 'reference',
      collection: 'geofences',
      help: 'The geofence being entered.'
    }
  },
  matchEvent: function(spec: any, event: any, actionContext: any) {
    return (
      spec.geofence === event.geofence &&
      spec.role === event.role
    );
  },
  getTitle: function(scriptContent, resource, registry) {
    const role = find(scriptContent.roles, { name: resource.role });
    const geofence = find(scriptContent.geofences, { name: resource.geofence });
    const waypoint = geofence ? find(scriptContent.waypoints, { name: geofence.center }) : null;
    return `${role ? role.title : 'unknown' } entered "${waypoint ? waypoint.title : 'unknown'}"`;
  }
};
