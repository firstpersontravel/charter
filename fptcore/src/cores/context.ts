const moment = require('moment');

const TextUtil = require('../utils/text').default;
import { find, get } from '../utils/lodash-replacements';
import type { Env, Trip, Player, PlayerEvalContext, EvalContext } from '../types';

class ContextCore {
  /**
   * Gather context for a player.
   */
  static gatherPlayerEvalContext(env: Env, trip: Trip, player: Player): PlayerEvalContext {
    const participant = player.participant || {};
    const profile = participant.profile || {};
    const role = find(get(trip, 'script.content.roles') || [],
      { name: player.roleName }) || {};
    const pageNamesByRole = trip.tripState.currentPageNamesByRole || {};
    const pageName = pageNamesByRole[player.roleName];
    const page = find(get(trip, 'script.content.pages') || [],
      { name: pageName }) || {};
    const link = (env.host || '') + '/s/' + player.id;
    const joinLink = (env.host || '') + '/entry/t/' + (trip.id || 0) + '/r/' + player.roleName;
    const contactName = role.title || participant.name || null;
    return Object.assign({}, profile.values, {
      link: link,
      join_link: joinLink,
      contact_name: contactName,
      user_name: participant.name,
      participant_name: participant.name,
      first_name: (participant.name || '').split(' ')[0],
      phone_number: participant.phoneNumber || null,
      directive: page && page.directive || null,
      headline: page && page.directive || null,
      location_latitude: participant.locationLatitude || null,
      location_longitude: participant.locationLongitude || null,
      location_accuracy: participant.locationAccuracy || null,
      location_timestamp: participant.locationTimestamp ?
        moment.utc(participant.locationTimestamp).toISOString() :
        null,
    });
  }

  /**
   * Gather all context for a trip.
   */
  static gatherEvalContext(env: Env, trip: Trip): EvalContext {
    // Gather schedule including var-ized time titles.
    const scheduleByTitle = Object.fromEntries(
      Object.keys(trip.schedule || {})
        .map((timeName: string) => (
          (trip.script.content.times || []).find(t => t.name === timeName)
        ))
        .filter(Boolean)
        .filter((time) => !!time!.title)
        .map((time) => (
          [TextUtil.varForText(time!.title), trip.schedule![time!.name]]
        )));
    const schedule = Object.assign({}, trip.schedule, scheduleByTitle);

    // Gather core values
    const context: EvalContext = Object.assign({}, trip.customizations, trip.values, {
      date: moment.utc(trip.date, 'YYYY-MM-DD').format('dddd, MMMM D'),
      tripState: trip.tripState,
      waypointOptions: trip.waypointOptions,
      schedule: schedule,
      history: trip.history,
      roleStates: {} as Record<string, PlayerEvalContext[]>
    });
    // Add waypoint values if present
    const waypointNames = Object.keys(trip.waypointOptions || {});
    waypointNames.forEach((waypointName: string) => {
      const waypoints = trip.script.content.waypoints;
      const waypoint = find(waypoints, { name: waypointName });
      if (!waypoint) {
        return;
      }
      const optionName = trip.waypointOptions![waypointName];
      const option = find(waypoint.options, { name: optionName });
      if (!option) {
        return;
      }
      if (option.values) {
        Object.assign(context, option.values);
      }
    });

    // Add player values
    const roles = get(trip, 'script.content.roles') || [];
    (trip.players || []).forEach((player: Player) => {
      const role = find(roles, { name: player.roleName });
      if (!role) {
        return;
      }
      const roleSlug = TextUtil.varForText(role.title);
      const playerContext = this.gatherPlayerEvalContext(env, trip, player);
      if (roleSlug) {
        context[roleSlug] = playerContext;
      }
      // LEGACY: for legacy role names that were determined by old scripts
      // (like headlands gamble), put the player context in as the old role name.
      // This means {{Player.directive}} will still work without requiring a
      // change at the moment to {{player.directive}}.
      if (player.roleName.indexOf('-') === -1) {
        context[player.roleName] = playerContext;
      }
      // Fill in role states by name -- if multiple players, choose one
      // arbitrarily.
      if (!context.roleStates![player.roleName]) {
        context.roleStates![player.roleName] = [];
      }
      context.roleStates![player.roleName].push(playerContext);
    });
    return context;
  }
}

export default ContextCore;
