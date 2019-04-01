const _ = require('lodash');

const distance = require('../utils/distance');
const WaypointCore = require('./waypoint');

class GeofenceCore {
  /**
   * Get all geofences overlapping an area.
   */
  static geofencesInArea(scriptContent, latitude, longitude, accuracy,
    waypointOptions) {
    if (!latitude || !longitude) {
      return [];
    }
    const geofences = scriptContent.geofences || [];
    return _.filter(geofences, (geofence) => {
      const waypointOption = WaypointCore.optionForWaypoint(scriptContent,
        geofence.center, waypointOptions);
      const dist = distance(latitude, longitude,
        waypointOption.coords[0], waypointOption.coords[1]);
      return dist - accuracy <= geofence.distance;
    });
  }
}

module.exports = GeofenceCore;
