var _ = require('lodash');

class WaypointCore {
  /**
   * Flatten out the list of waypoints and options into one list
   * of all possible waypoints
   */
  static getAllWaypointOptions(scriptContent) {
    return _(scriptContent.waypoints || [])
      .map(function(waypoint) {
        return waypoint.options ? waypoint.options : [waypoint];
      })
      .flatten()
      .value();
  }

  /**
   * Flatten out a waypoint into a list of options.
   */
  static optionsForWaypoint(scriptContent, waypointName) {
    var waypoint = _.find(scriptContent.waypoints || [], {
      name: waypointName
    });
    return waypoint.options ? waypoint.options : [waypoint];
  }

  /**
   * Look up a waypoint name and get the chosen option.
   */
  static optionForWaypoint(scriptContent, waypointName,
    waypointOptions) {
    var waypoint = _.find(scriptContent.waypoints, { name: waypointName });
    var waypointOptionName = (waypointOptions || {})[waypointName];
    var waypointOption = _.find(waypoint.options, { name: waypointOptionName });
    return waypointOption || waypoint.options[0];
  }
}

module.exports = WaypointCore;
