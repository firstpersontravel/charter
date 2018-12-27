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
 * Look up the directions for a given route and options from context.
 */
WaypointCore.directionsForRoute = function(scriptContent, routeName,
  waypointOptions) {
  var route = _.find(scriptContent.routes || [], { name: routeName });
  if (!route) {
    return null;
  }
  var fromOption = WaypointCore.optionForWaypoint(scriptContent,
    route.from, waypointOptions);
  var toOption = WaypointCore.optionForWaypoint(scriptContent,
    route.to, waypointOptions);
  return _.find(scriptContent.directions || [], {
    route: routeName,
    from_option: fromOption.name,
    to_option: toOption.name
  });
};

/**
 * Look up a waypoint name and get the chosen option.
 */
WaypointCore.optionForWaypoint = function(scriptContent, waypointName,
  waypointOptions) {
  var waypoint = _.find(scriptContent.waypoints, { name: waypointName });
  if (!waypoint.options) {
    return waypoint;
  }
  var waypointOptionName = (waypointOptions || {})[waypointName];
  var waypointOption = _.find(waypoint.options, { name: waypointOptionName });
  return waypointOption || waypoint.options[0];
};

module.exports = WaypointCore;
