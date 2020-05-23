const distance = require('../utils/distance');
const WaypointCore = require('./waypoint');

class GeofenceCore {
  static isOverlappingGeofence(scriptContent, latitude, longitude, accuracy,
    waypointOptions, geofence) {
    const waypointOption = WaypointCore.optionForWaypoint(scriptContent,
      geofence.center, waypointOptions);
    const dist = distance(latitude, longitude,
      waypointOption.coords[0], waypointOption.coords[1]);
    return dist - accuracy <= geofence.distance;    
  }

  /**
   * Get all geofences overlapping an area.
   */
  static geofencesInArea(scriptContent, latitude, longitude, accuracy,
    waypointOptions) {
    if (!latitude || !longitude) {
      return [];
    }
    const geofences = scriptContent.geofences || [];
    return geofences.filter(g => this.isOverlappingGeofence(scriptContent,
      latitude, longitude, accuracy, waypointOptions, g));
  }
}

module.exports = GeofenceCore;
