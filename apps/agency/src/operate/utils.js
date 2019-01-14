import _ from 'lodash';

import { EvalCore, PlayerCore } from 'fptcore';

export function sortForRole(role) {
  if (role.primary) {
    return -1;
  }
  return 0;
}

export function getPlayerPageInfo(trip, player) {
  return PlayerCore.getPageInfo(trip.script, trip.evalContext,
    player);
}

function getGroupPlayersForRole(group, roleName) {
  const role = _.find(group.script.content.roles, { name: roleName });
  return group.trips
    .filter(trip => (
      !role.if || EvalCore.if(trip.evalContext, role.if)
    ))
    .map(trip => (
      _.find(trip.players, { roleName: role.name })
    ))
    .filter(Boolean)
    .filter(player => (
      player.currentPageName
    ));
}

function getTripPlayersForRoles(trip, roleFilters) {
  const roles = _.filter(trip.script.content.roles, roleFilters);
  return roles
    .filter(role => (
      !role.if || EvalCore.if(trip.evalContext, role.if)
    ))
    .map(role => (
      _.find(trip.players, { roleName: role.name })
    ))
    .filter(Boolean)
    .filter(player => (
      player.currentPageName
    ));
}

function getTripPlayers(trip) {
  return getTripPlayersForRoles(trip, { user: true, actor: false });
}

function getPlayerSceneSort(trip, player) {
  return PlayerCore.getSceneSort(trip.script, trip.evalContext,
    player);
}

function getUserActors(group, role) {
  const groupPlayers = getGroupPlayersForRole(group, role.name);
  const actors = _(groupPlayers)
    .sortBy((player) => {
      if (!player) {
        return null;
      }
      const trip = _.find(group.trips, { id: player.tripId });
      return getPlayerSceneSort(trip, player);
    })
    .value();
  const actorsByUserId = _.groupBy(actors, 'userId');
  const roleHasMultipleUsers = _.keys(actorsByUserId).length > 1;
  return _.map(actorsByUserId, (actorsWithUser, userId) => ({
    role: role,
    userId: userId,
    actors: actorsWithUser,
    roleHasMultipleUsers: roleHasMultipleUsers
  }));
}

function getActors(group) {
  const actorRoles = _.filter(group.script.content.roles,
    { user: true, actor: true });
  const userActorsByRole = actorRoles
    .map(role => getUserActors(group, role));
  const rolesAndActors = _(userActorsByRole)
    .flatten()
    .filter(roleAndActors => roleAndActors.actors.length > 0)
    .value();
  return _.sortBy(rolesAndActors, (roleAndActors) => {
    const actor = roleAndActors.actors[0];
    const trip = _.find(group.trips, { id: actor.tripId });
    return getPlayerSceneSort(trip, actor);
  });
}

function isActorByRoleActive(group, roleAndActors) {
  const firstActor = roleAndActors.actors[0];
  const trip = _.find(group.trips, { id: firstActor.tripId });
  const pageInfo = getPlayerPageInfo(trip, firstActor);
  return pageInfo && pageInfo.appearanceIsActive;
}

export function sortPlayers(group) {
  const playersByTrip = group.trips.map(trip => ({
    trip: trip,
    players: getTripPlayers(trip)
  }));
  const actorsByRole = getActors(group);
  const activeActorsByRole = _.filter(actorsByRole, a => (
    isActorByRoleActive(group, a)
  ));
  const inactiveActorsByRole = _.reject(actorsByRole, a => (
    isActorByRoleActive(group, a)
  ));
  return {
    playersByTrip: playersByTrip,
    activeActorsByRole: activeActorsByRole,
    inactiveActorsByRole: inactiveActorsByRole
  };
}

export default {
  sortForRole: sortForRole,
  getPlayerPageInfo: getPlayerPageInfo,
  sortPlayers: sortPlayers
};
