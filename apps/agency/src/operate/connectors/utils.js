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

const tripIncludes = {
  org: instanceIncluder('orgs', 'id', 'orgId'),
  experience: instanceIncluder('experiences', 'id', 'experienceId'),
  script: instanceIncluder('scripts', 'id', 'scriptId'),
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
  trips: instancesIncluder('trips', 'groupId', 'id', { isArchived: false },
    tripIncludes)
}, groupIncludes);

export function lookupTrip(state, ownProps) {
  return instanceFromDatastore(state, {
    col: 'trips',
    filter: {
      isArchived: false,
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
      trip: {
        groupId: Number(ownProps.params.groupId),
        isArchived: false
      }
    },
    include: playerIncludesWithTrip
  });
}

export function lookupGroup(state, ownProps) {
  return instanceFromDatastore(state, {
    col: 'groups',
    filter: {
      isArchived: false,
      org: { name: ownProps.params.orgName },
      experience: { name: ownProps.params.experienceName },
      id: Number(ownProps.params.groupId)
    },
    include: groupIncludesWithTrips
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
