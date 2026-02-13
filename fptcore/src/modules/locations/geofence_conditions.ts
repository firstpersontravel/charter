const GeofenceCore = require('../../cores/geofence').default;
import type { ActionContext } from '../../types';

export default {
  role_in_geofence: {
    help: 'A condition that passes if a role is within a geofence.',
    properties: {
      role: {
        type: 'reference',
        collection: 'roles',
        required: true,
        display: { label: false },
        help: 'The role to check.'
      },
      geofence: {
        type: 'reference',
        collection: 'geofences',
        required: true,
        help: 'The geofence that a player with this role must be within.'
      }
    },
    eval: (params: Record<string, any>, actionContext: ActionContext) => {
      const allRoleStates = actionContext.evalContext.roleStates;
      const roleStates = allRoleStates[params.role] || [];
      const geofence = (actionContext.scriptContent.geofences || [])
        .find(g => g.name === params.geofence);
      if (!geofence) {
        return false;
      }
      // If any player with this role is inside the geofence, return true.
      for (const roleState of roleStates) {
        const latitude = roleState.location_latitude;
        const longitude = roleState.location_longitude;
        const accuracy = roleState.location_accuracy;
        if (!latitude || !longitude || !accuracy) {
          continue;
        }
        const waypointOptions = actionContext.evalContext.waypointOptions;
        if (GeofenceCore.isOverlappingGeofence(actionContext.scriptContent,
          latitude, longitude, accuracy, waypointOptions, geofence)) {
          return true;
        }
      }
      return false;
    }
  }
};

