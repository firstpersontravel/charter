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

function getPlayerParticipant(state, instance) {
  return _.find(state.datastore.participants, { id: instance.participantId });
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
  participant: getPlayerParticipant,
  role: getPlayerRole
};

const scriptIncludes = {
  org: instanceIncluder('orgs', 'id', 'orgId'),
  experience: instanceIncluder('experiences', 'id', 'experienceId')
};

const tripIncludes = {
  org: instanceIncluder('orgs', 'id', 'orgId'),
  experience: instanceIncluder('experiences', 'id', 'experienceId'),
  script: instanceIncluder('scripts', 'id', 'scriptId', scriptIncludes),
  players: instancesIncluder('players', 'tripId', 'id', {}, playerIncludes),
  evalContext: getTripEvalContext,
  actionContext: getTripActionContext
};

const playerIncludesWithTrip = Object.assign({
  trip: instanceIncluder('trips', 'id', 'tripId', tripIncludes),
  org: getPlayerOrgFromTrip,
  experience: getPlayerExperienceFromTrip
}, playerIncludes);

export function lookupOrg(state, ownProps) {
  const authData = _.find(state.datastore.auth, { id: 'latest' }).data;
  return _.find(authData.orgs, { name: ownProps.match.params.orgName });
}

export function lookupExperience(state, ownProps) {
  return instanceFromDatastore(state, {
    col: 'experiences',
    filter: {
      name: ownProps.match.params.experienceName
    }
  });
}

export function lookupScript(state, ownProps) {
  return instanceFromDatastore(state, {
    col: 'scripts',
    filter: {
      experience: { name: ownProps.match.params.experienceName }
      // isActive: true
    },
    include: scriptIncludes
  });
}

export function lookupTrip(state, ownProps) {
  return instanceFromDatastore(state, {
    col: 'trips',
    filter: {
      org: { name: ownProps.match.params.orgName },
      experience: { name: ownProps.match.params.experienceName },
      id: Number(ownProps.match.params.tripId)
    },
    include: tripIncludes
  });
}

export function lookupPlayer(state, ownProps) {
  return instanceFromDatastore(state, {
    col: 'players',
    filter: {
      roleName: ownProps.match.params.roleName,
      tripId: Number(ownProps.match.params.tripId)
    },
    include: playerIncludesWithTrip
  });
}

export function lookupPlayersByRole(state, ownProps) {
  const participantId = ownProps.match.params.participantId !== '0'
    ? Number(ownProps.match.params.participantId) : null;
  return instancesFromDatastore(state, {
    col: 'players',
    filter: {
      roleName: ownProps.match.params.roleName,
      participantId: participantId,
      trip: { isArchived: false }
    },
    include: playerIncludesWithTrip
  });
}

export function lookupActiveTrips(state, ownProps) {
  return instancesFromDatastore(state, {
    col: 'trips',
    filter: {
      org: { name: ownProps.match.params.orgName },
      experience: { name: ownProps.match.params.experienceName },
      isArchived: false
    },
    include: tripIncludes
  });
}

function msgFilterForParams(match) {
  // If we're specifying two roles, find all messages between those roles.
  if (match.params.roleName
      && match.params.withRoleName
      && match.params.withRoleName !== 'All') {
    const betweenRoleNames = [match.params.roleName, match.params.withRoleName];
    return msg => (
      _.includes(betweenRoleNames, msg.fromRoleName)
      && _.includes(betweenRoleNames, msg.toRoleName)
    );
  }
  // If we're specifying one role, find all messages to and from that role
  if (match.params.roleName) {
    return msg => (
      msg.fromRoleName === match.params.roleName
      || msg.toRoleName === match.params.roleName
    );
  }
  // If no roles are specified, return all.
  return msg => true;
}

export function lookupMessages(state, ownProps, limit = null, filters = null) {
  const selfFilter = msgFilterForParams(ownProps.match);
  const tripFilter = ownProps.match.params.tripId
    ? { id: Number(ownProps.match.params.tripId), isArchived: false }
    : {
      org: { name: ownProps.match.params.orgName },
      experience: { name: ownProps.match.params.experienceName },
      isArchived: false
    };
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
        script: instanceIncluder('scripts', 'id', 'scriptId'),
        experience: instanceIncluder('experiences', 'id', 'experienceId'),
        players: instancesIncluder('players', 'tripId', 'id', {},
          playerIncludes)
      })
    }
  });
}

export function lookupDirections(state, ownProps) {
  return instancesFromDatastore(state, {
    col: 'assets',
    filter: {
      type: 'directions',
      org: { name: ownProps.match.params.orgName },
      experience: { name: ownProps.match.params.experienceName }
    },
    include: {
      org: instanceIncluder('orgs', 'id', 'orgId'),
      experience: instanceIncluder('experiences', 'id', 'experienceId')
    }
  });
}

export function lookupUpcomingActions(state, ownProps) {
  const trips = lookupActiveTrips(state, ownProps);
  const tripIds = _.map(trips, 'id');
  // Filter actions by those greater than an hour ago -- to allow
  // some time to unarchive archived actions.
  const oneHourAgo = moment.utc().subtract(1, 'hours');
  const actions = _(state.datastore.actions)
    .filter(action => _.includes(tripIds, action.tripId))
    .filter(action => action.appliedAt === null && action.failedAt === null)
    .filter(action => moment.utc(action.scheduledAt).isAfter(oneHourAgo))
    .sortBy('scheduledAt')
    .value();
  return actions;
}
