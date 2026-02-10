import { find } from '../utils/lodash-replacements';

class WaypointCore {
  /**
   * Flatten out the list of waypoints and options into one list
   * of all possible waypoints
   */
  static getAllWaypointOptions(scriptContent: any): any[] {
    return (scriptContent.waypoints || [])
      .map((waypoint: any) => waypoint.options || [])
      .flat();
  }

  /**
   * Flatten out a waypoint into a list of options.
   */
  static optionsForWaypoint(scriptContent: any, waypointName: string): any[] {
    const waypoint = find(scriptContent.waypoints || [], {
      name: waypointName
    });
    return waypoint.options;
  }

  /**
   * Look up a waypoint name and get the chosen option.
   */
  static optionForWaypoint(scriptContent: any, waypointName: string,
    waypointOptions: any): any {
    const waypoint = find(scriptContent.waypoints, { name: waypointName });
    const waypointOptionName = (waypointOptions || {})[waypointName];
    const waypointOption = find(waypoint.options, { name: waypointOptionName });
    return waypointOption || waypoint.options[0];
  }
}

module.exports = WaypointCore;
