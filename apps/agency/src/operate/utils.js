import _ from 'lodash';

import { EvalCore, PlayerCore } from 'fptcore';

export function sortForRole(role) {
  if (role.primary) {
    return -1;
  }
  if (role.minor) {
    return 1;
  }
  return 0;
}

export function getPlayerPageInfo(player) {
  const trip = player.trip;
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

function getPlayerSceneSort(player) {
  const trip = player.trip;
  return PlayerCore.getSceneSort(trip.script, trip.evalContext,
    player);
}

function getUserActors(group, role) {
  const actors = _.sortBy(
    getGroupPlayersForRole(group, role.name),
    getPlayerSceneSort);
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
  return _.sortBy(rolesAndActors, roleAndActors => (
    getPlayerSceneSort(roleAndActors.actors[0])
  ));
}

function isActorByRoleActive(roleAndActors) {
  const pageInfo = getPlayerPageInfo(roleAndActors.actors[0]);
  return pageInfo && pageInfo.appearanceIsActive;
}

export function sortPlayers(group) {
  const playersByTrip = group.trips.map(trip => ({
    trip: trip,
    players: getTripPlayers(trip)
  }));
  const actorsByRole = getActors(group);
  const activeActorsByRole = _.filter(actorsByRole, isActorByRoleActive);
  const inactiveActorsByRole = _.reject(actorsByRole, isActorByRoleActive);
  return {
    playersByTrip: playersByTrip,
    activeActorsByRole: activeActorsByRole,
    inactiveActorsByRole: inactiveActorsByRole
  };
}

export function getMessagesNeedingReply(state, groupId, roleName) {
  const trips = _.filter(state.datastore.trips,
    { groupId: Number(groupId), isArchived: false });
  const tripIds = _.map(trips, 'id');
  return state.datastore.messages
    .filter((message) => {
      if (!_.includes(tripIds, message.tripId)) {
        return false;
      }
      if (!message.isReplyNeeded || message.replyReceivedAt) {
        return false;
      }
      // If not role name, then return all messages needing reply.
      if (!roleName) {
        return true;
      }
      const sentTo = _.find(state.datastore.players,
        { id: message.sentToId });
      return roleName === sentTo.roleName;
    });
}

export default {
  sortForRole: sortForRole,
  getPlayerPageInfo: getPlayerPageInfo,
  getMessagesNeedingReply: getMessagesNeedingReply,
  sortPlayers: sortPlayers
};
