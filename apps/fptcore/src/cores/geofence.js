var _ = require('lodash');

var distance = require('../utils/distance');
var WaypointCore = require('./waypoint');

var GeofenceCore = {};

/**
 * Get all geofences overlapping an area.
 */
GeofenceCore.geofencesInArea = function(scriptContent, latitude, longitude,
  accuracy, waypointOptions) {
  if (!latitude || !longitude) {
    return [];
  }
  var geofences = scriptContent.geofences || [];
  return _.filter(geofences, function(geofence) {
    var waypointOption = WaypointCore.optionForWaypoint(scriptContent,
      geofence.center, waypointOptions);
    var dist = distance(latitude, longitude,
      waypointOption.coords[0], waypointOption.coords[1]);
    return dist - accuracy <= geofence.distance;
  });
};

module.exports = GeofenceCore;
