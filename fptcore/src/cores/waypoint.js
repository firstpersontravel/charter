const { find } = require('../utils/lodash-replacements');

class WaypointCore {
  /**
   * Flatten out the list of waypoints and options into one list
   * of all possible waypoints
   */
  static getAllWaypointOptions(scriptContent) {
    return (scriptContent.waypoints || [])
      .map(waypoint => waypoint.options || [])
      .flat();
  }

  /**
   * Flatten out a waypoint into a list of options.
   */
  static optionsForWaypoint(scriptContent, waypointName) {
    var waypoint = find(scriptContent.waypoints || [], {
      name: waypointName
    });
    return waypoint.options;
  }

  /**
   * Look up a waypoint name and get the chosen option.
   */
  static optionForWaypoint(scriptContent, waypointName,
    waypointOptions) {
    var waypoint = find(scriptContent.waypoints, { name: waypointName });
    var waypointOptionName = (waypointOptions || {})[waypointName];
    var waypointOption = find(waypoint.options, { name: waypointOptionName });
    return waypointOption || waypoint.options[0];
  }
}

module.exports = WaypointCore;
