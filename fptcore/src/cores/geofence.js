const distance = require('../utils/distance');
const WaypointCore = require('./waypoint');

// For accuracies less than 10 meters, count as 10 meters for the purposes of overlap -- otherwise
// it can be overly permissive.
const MAX_ACCURACY_FOR_OVERLAP = 10;

class GeofenceCore {
  static isOverlappingGeofence(scriptContent, latitude, longitude, accuracy, waypointOptions,
    geofence) {
    const accuracyCapped = Math.min(accuracy, MAX_ACCURACY_FOR_OVERLAP);
    const opt = WaypointCore.optionForWaypoint(scriptContent, geofence.center, waypointOptions);
    const dist = distance(latitude, longitude, opt.location.coords[0], opt.location.coords[1]);
    return dist - accuracyCapped <= geofence.distance;
  }

  /**
   * Get all geofences overlapping an area.
   */
  static geofencesInArea(scriptContent, latitude, longitude, accuracy, waypointOptions) {
    if (!latitude || !longitude) {
      return [];
    }
    const geofences = scriptContent.geofences || [];
    return geofences.filter(g => this.isOverlappingGeofence(scriptContent,
      latitude, longitude, accuracy, waypointOptions, g));
  }
}

module.exports = GeofenceCore;
