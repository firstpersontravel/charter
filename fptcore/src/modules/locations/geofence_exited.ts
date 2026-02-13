import { find } from '../../utils/lodash-replacements';
import type { ActionContext, Event, ScriptContent } from '../../types';

export default {
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
  matchEvent: function(spec: Record<string, any>, event: Event, actionContext: ActionContext) {
    return (
      spec.geofence === event.geofence &&
      spec.role === event.role
    );
  },
  getTitle: function(scriptContent: ScriptContent, resource: Record<string, any>, registry: any) {
    const role = find(scriptContent.roles, { name: resource.role });
    const geofence = find(scriptContent.geofences, { name: resource.geofence });
    const waypoint = geofence ? find(scriptContent.waypoints, { name: geofence.center }) : null;
    return `${role ? role.title : 'unknown'} exited "${waypoint ? waypoint.title : 'unknown'}"`;
  }
};
