import { find } from '../utils/lodash-replacements';
import type { ScriptContent, WaypointOption } from '../types';

class WaypointCore {
  /**
   * Flatten out the list of waypoints and options into one list
   * of all possible waypoints
   */
  static getAllWaypointOptions(scriptContent: ScriptContent): WaypointOption[] {
    return (scriptContent.waypoints || [])
      .map(waypoint => waypoint.options || [])
      .flat();
  }

  /**
   * Flatten out a waypoint into a list of options.
   */
  static optionsForWaypoint(scriptContent: ScriptContent, waypointName: string): WaypointOption[] {
    const waypoint = find(scriptContent.waypoints || [], {
      name: waypointName
    });
    return waypoint.options;
  }

  /**
   * Look up a waypoint name and get the chosen option.
   */
  static optionForWaypoint(scriptContent: ScriptContent, waypointName: string,
    waypointOptions: Record<string, string>): WaypointOption {
    const waypoint = find(scriptContent.waypoints, { name: waypointName });
    const waypointOptionName = (waypointOptions || {})[waypointName];
    const waypointOption = find(waypoint.options, { name: waypointOptionName });
    return waypointOption || waypoint.options[0];
  }
}

module.exports = WaypointCore;
