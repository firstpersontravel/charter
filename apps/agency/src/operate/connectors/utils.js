import _ from 'lodash';
import moment from 'moment';

import { ContextCore } from 'fptcore';

import {
  instanceIncluder,
  instancesIncluder,
  instanceFromDatastore,
  instancesFromDatastore
} from '../../datastore-utils';

function getPlayerOrgFromTrip(state, instance) {
  return instance.trip.org;
}

function getPlayerExperienceFromTrip(state, instance) {
  return instance.trip.experience;
}

function getPlayerUser(state, instance) {
  return _.find(state.datastore.users, { id: instance.userId });
}

function getPlayerRole(state, instance) {
  const trip = _.find(state.datastore.trips, { id: instance.tripId });
  const script = _.find(state.datastore.scripts, { id: trip.scriptId });
  if (!script) {
    return null;
  }
  const role = _.find(script.content.roles, { name: instance.roleName });
  return role;
}

function getTripEvalContext(state, instance) {
  if (!instance.script.content) {
    return null;
  }
  const env = {
    host: `${window.location.protocol}//${window.location.hostname}`
  };
  return ContextCore.gatherEvalContext(env, instance);
}

function getTripActionContext(state, instance) {
  if (!instance.script.content) {
    return null;
  }
  return {
    scriptContent: instance.script.content,
    evalContext: instance.evalContext,
    timezone: instance.experience.timezone,
    evaluateAt: moment.utc()
  };
}

const playerIncludes = {
  user: getPlayerUser,
  role: getPlayerRole
};

const scriptIncludes = {
  org: instanceIncluder('orgs', 'id', 'orgId'),
  experience: instanceIncluder('experiences', 'id', 'experienceId')
};

const tripIncludes = {
  org: instanceIncluder('orgs', 'id', 'orgId'),
  experience: instanceIncluder('experiences', 'id', 'experienceId'),
  script: instanceIncluder('scripts', 'id', 'scriptId', {}, scriptIncludes),
  players: instancesIncluder('players', 'tripId', 'id', {}, playerIncludes),
  evalContext: getTripEvalContext,
  actionContext: getTripActionContext
};

const groupIncludes = {
  org: instanceIncluder('orgs', 'id', 'orgId'),
  experience: instanceIncluder('experiences', 'id', 'experienceId'),
  script: instanceIncluder('scripts', 'id', 'scriptId')
};

const tripIncludesWithGroup = Object.assign({
  group: instanceIncluder('groups', 'id', 'groupId', groupIncludes)
}, tripIncludes);

const playerIncludesWithTrip = Object.assign({
  trip: instanceIncluder('trips', 'id', 'tripId', tripIncludesWithGroup),
  org: getPlayerOrgFromTrip,
  experience: getPlayerExperienceFromTrip
}, playerIncludes);

const groupIncludesWithTrips = Object.assign({
  trips: instancesIncluder('trips', 'groupId', 'id', {}, tripIncludes)
}, groupIncludes);

export function lookupTrip(state, ownProps) {
  return instanceFromDatastore(state, {
    col: 'trips',
    filter: {
      org: { name: ownProps.params.orgName },
      experience: { name: ownProps.params.experienceName },
      id: Number(ownProps.params.tripId)
    },
    include: tripIncludesWithGroup
  });
}

export function lookupPlayer(state, ownProps) {
  return instanceFromDatastore(state, {
    col: 'players',
    filter: {
      roleName: ownProps.params.roleName,
      tripId: Number(ownProps.params.tripId)
    },
    include: playerIncludesWithTrip
  });
}

export function lookupPlayersByRole(state, ownProps) {
  const userId = ownProps.params.userId !== '0' ?
    Number(ownProps.params.userId) : null;
  return instancesFromDatastore(state, {
    col: 'players',
    filter: {
      roleName: ownProps.params.roleName,
      userId: userId,
      trip: { groupId: Number(ownProps.params.groupId) }
    },
    include: playerIncludesWithTrip
  });
}

export function lookupGroup(state, ownProps) {
  return instanceFromDatastore(state, {
    col: 'groups',
    filter: {
      org: { name: ownProps.params.orgName },
      experience: { name: ownProps.params.experienceName },
      id: Number(ownProps.params.groupId)
    },
    include: groupIncludesWithTrips
  });
}

function msgFilterForParams(params) {
  // If we're specifying two roles, find all messages between those roles.
  if (params.roleName &&
      params.withRoleName &&
      params.withRoleName !== 'All') {
    const betweenRoleNames = [params.roleName, params.withRoleName];
    return msg => (
      _.includes(betweenRoleNames, msg.sentBy.roleName) &&
      _.includes(betweenRoleNames, msg.sentTo.roleName)
    );
  }
  // If we're specifying one role, find all messages to and from that role
  if (params.roleName) {
    return msg => (
      msg.sentBy.roleName === params.roleName ||
      msg.sentTo.roleName === params.roleName
    );
  }
  // If no roles are specified, return all.
  return msg => true;
}

export function lookupMessages(state, ownProps, limit = null, filters = null) {
  const selfFilter = msgFilterForParams(ownProps.params);
  const tripFilter = ownProps.params.tripId ?
    { id: Number(ownProps.params.tripId), isArchived: false } :
    { groupId: Number(ownProps.params.groupId), isArchived: false };
  const msgFilters = { trip: tripFilter, self: selfFilter };
  const allFilters = Object.assign(msgFilters, filters);
  return instancesFromDatastore(state, {
    col: 'messages',
    filter: allFilters,
    sort: msg => -msg.id,
    limit: limit,
    include: {
      trip: instanceIncluder('trips', 'id', 'tripId', {
        org: instanceIncluder('orgs', 'id', 'orgId'),
        experience: instanceIncluder('experiences', 'id', 'experienceId')
      }),
      sentBy: instanceIncluder('players', 'id', 'sentById', playerIncludes),
      sentTo: instanceIncluder('players', 'id', 'sentToId', playerIncludes)
    }
  });
}

export function lookupDirections(state, ownProps) {
  return instancesFromDatastore(state, {
    col: 'assets',
    filter: {
      type: 'directions',
      org: { name: ownProps.params.orgName },
      experience: { name: ownProps.params.experienceName }
    },
    include: {
      org: instanceIncluder('orgs', 'id', 'orgId'),
      experience: instanceIncluder('experiences', 'id', 'experienceId')
    }
  });
}

export function lookupUpcomingActions(state, ownProps) {
  const group = lookupGroup(state, ownProps);
  const tripIds = _.map(group.trips, 'id');
  // Filter actions by those greater than an hour ago -- to allow
  // some time to unarchive archived actions.
  const oneHourAgo = moment.utc().subtract(1, 'hours');
  const actions = _(state.datastore.actions)
    .filter(action => _.includes(tripIds, action.tripId))
    .filter({ appliedAt: null, failedAt: null })
    .filter(action => moment.utc(action.scheduledAt).isAfter(oneHourAgo))
    .sortBy('scheduledAt')
    .value();
  return actions;
}
