const distance = require('../utils/distance').default;
const WaypointCore = require('./waypoint').default;

import type { ScriptContent, ScriptGeofence } from '../types';

// For accuracies less than 10 meters, count as 10 meters for the purposes of overlap -- otherwise
// it can be overly permissive.
const MAX_ACCURACY_FOR_OVERLAP = 10;

class GeofenceCore {
  static isOverlappingGeofence(scriptContent: ScriptContent, latitude: number, longitude: number, accuracy: number, waypointOptions: Record<string, string>,
    geofence: ScriptGeofence): boolean {
    const accuracyCapped = Math.min(accuracy, MAX_ACCURACY_FOR_OVERLAP);
    const opt = WaypointCore.optionForWaypoint(scriptContent, geofence.center, waypointOptions);
    const dist = distance(latitude, longitude, opt.location.coords[0], opt.location.coords[1]);
    return dist - accuracyCapped <= geofence.distance;
  }

  /**
   * Get all geofences overlapping an area.
   */
  static geofencesInArea(scriptContent: ScriptContent, latitude: number, longitude: number, accuracy: number, waypointOptions: Record<string, string>): ScriptGeofence[] {
    if (!latitude || !longitude) {
      return [];
    }
    const geofences = scriptContent.geofences || [];
    return geofences.filter(g => this.isOverlappingGeofence(scriptContent,
      latitude, longitude, accuracy, waypointOptions, g));
  }
}

export default GeofenceCore;

