import _ from 'lodash';

import { EvalCore, ParticipantCore } from 'fptcore';

export function sortForRole(role) {
  if (role.primary) {
    return -1;
  }
  if (role.minor) {
    return 1;
  }
  return 0;
}

export function getParticipantPageInfo(participant) {
  const trip = participant.trip;
  return ParticipantCore.getPageInfo(trip.script, trip.context,
    participant);
}

function getGroupParticipantsForRole(group, roleName) {
  const role = _.find(group.script.content.roles, { name: roleName });
  return group.trips
    .filter(trip => (
      !role.if || EvalCore.if(trip.context, role.if)
    ))
    .map(trip => (
      _.find(trip.participants, { roleName: role.name })
    ))
    .filter(Boolean)
    .filter(participant => (
      participant.currentPageName
    ));
}

function getTripParticipantsForRoles(trip, roleFilters) {
  const roles = _.filter(trip.script.content.roles, roleFilters);
  return roles
    .filter(role => (
      !role.if || EvalCore.if(trip.context, role.if)
    ))
    .map(role => (
      _.find(trip.participants, { roleName: role.name })
    ))
    .filter(Boolean)
    .filter(participant => (
      participant.currentPageName
    ));
}

function getTripPlayers(trip) {
  return getTripParticipantsForRoles(trip, { user: true, actor: false });
}

function getParticipantSceneSort(participant) {
  const trip = participant.trip;
  return ParticipantCore.getSceneSort(trip.script, trip.context,
    participant);
}

function getUserActors(group, role) {
  const actors = _.sortBy(
    getGroupParticipantsForRole(group, role.name),
    getParticipantSceneSort);
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
    getParticipantSceneSort(roleAndActors.actors[0])
  ));
}

function isActorByRoleActive(roleAndActors) {
  const pageInfo = getParticipantPageInfo(roleAndActors.actors[0]);
  return pageInfo && pageInfo.pagesetIsActive;
}

export function sortParticipants(group) {
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
  const trips = _.filter(state.datastore.playthroughs,
    { groupId: Number(groupId), isArchived: false });
  const tripIds = _.map(trips, 'id');
  return state.datastore.messages
    .filter((message) => {
      if (!_.includes(tripIds, message.playthroughId)) {
        return false;
      }
      if (!message.isReplyNeeded || message.replyReceivedAt) {
        return false;
      }
      // If not role name, then return all messages needing reply.
      if (!roleName) {
        return true;
      }
      const sentTo = _.find(state.datastore.participants,
        { id: message.sentToId });
      return roleName === sentTo.roleName;
    });
}

export default {
  sortForRole: sortForRole,
  getParticipantPageInfo: getParticipantPageInfo,
  getMessagesNeedingReply: getMessagesNeedingReply,
  sortParticipants: sortParticipants
};
