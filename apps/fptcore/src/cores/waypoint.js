var _ = require('lodash');

var WaypointCore = {};

/**
 * Flatten out the list of waypoints and options into one list
 * of all possible waypoints
 */
WaypointCore.getAllWaypointOptions = function(scriptContent) {
  return _(scriptContent.waypoints || [])
    .map(function(waypoint) {
      return waypoint.options ? waypoint.options : [waypoint];
    })
    .flatten()
    .value();
};

/**
 * Flatten out a waypoint into a list of options.
 */
WaypointCore.optionsForWaypoint = function(scriptContent, waypointName) {
  var waypoint = _.find(scriptContent.waypoints || [], {
    name: waypointName
  });
  return waypoint.options ? waypoint.options : [waypoint];
};

/**
 * Look up a waypoint name and get the chosen option.
 */
WaypointCore.optionForWaypoint = function(scriptContent, waypointName,
  waypointOptions) {
  var waypoint = _.find(scriptContent.waypoints, { name: waypointName });
  var waypointOptionName = (waypointOptions || {})[waypointName];
  var waypointOption = _.find(waypoint.options, { name: waypointOptionName });
  return waypointOption || waypoint.options[0];
};

module.exports = WaypointCore;
