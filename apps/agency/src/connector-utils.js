import _ from 'lodash';
import moment from 'moment';

import { ContextCore } from 'fptcore';

export function areRequestsLoading(requestsState, operations) {
  return _.some(_.map(operations, (operation => (
    requestsState[operation] === 'pending'
  ))));
}

export function areRequestsError(requestsState, operations) {
  return _.some(_.map(operations, (operation => (
    requestsState[operation] === 'rejected'
  ))));
}

export function instancesStatus(state, collectionName, query) {
  const operations = [`${collectionName}.list`, `${collectionName}.get`];
  const collection = state.datastore[collectionName];
  const instances = query ? _.filter(collection, query) : collection;
  if (areRequestsLoading(state.requests, operations)) {
    return { isLoading: true, isError: false, instances: instances };
  }
  if (areRequestsError(state.requests, operations)) {
    return { isLoading: false, isError: true, instances: instances };
  }
  return { isLoading: false, isError: false, instances: instances };
}

export function instanceStatus(state, collectionName, query) {
  const status = instancesStatus(state, collectionName, query);
  return {
    isLoading: status.isLoading,
    isError: status.isError,
    instance: status.instances.length ? status.instances[0] : null
  };
}

export function assembleTripStatus(state, tripId) {
  const tripStatus = instanceStatus(state, 'trips', { id: Number(tripId) });
  const experienceId = _.get(tripStatus, 'instance.experienceId');
  const experienceStatus = instanceStatus(state, 'experiences',
    { id: experienceId });
  const scriptId = _.get(tripStatus, 'instance.scriptId');
  const scriptStatus = instanceStatus(state, 'scripts', { id: scriptId });
  const playersStatus = instancesStatus(state, 'players',
    { tripId: Number(tripId) });
  const users = state.datastore.users;
  const trip = _.clone(tripStatus.instance);
  const env = {
    host: `${window.location.protocol}//${window.location.hostname}`
  };

  const experience = experienceStatus.instance;
  const script = scriptStatus.instance;
  if (trip && experience && script) {
    trip.experience = experienceStatus.instance;
    trip.script = scriptStatus.instance;
    const roles = _.get(scriptStatus.instance, 'content.roles') || [];
    trip.players = _.map(playersStatus.instances, instance => (
      _.assign({}, instance, {
        trip: trip,
        role: _.find(roles, { name: instance.roleName }),
        user: _.find(users, { id: instance.userId })
      })
    ));
    trip.evalContext = ContextCore.gatherEvalContext(env, trip);
    trip.actionContext = {
      scriptContent: script.content,
      timezone: experience,
      evalContext: trip.evalContext,
      evaluateAt: moment.utc()
    };
  }
  const isLoading = (
    experienceStatus.isLoading ||
    scriptStatus.isLoading ||
    tripStatus.isLoading ||
    playersStatus.isLoading
  );
  const isError = (
    experienceStatus.isError ||
    scriptStatus.isError ||
    tripStatus.isError ||
    playersStatus.isError
  );
  return {
    isLoading: isLoading,
    isError: isError,
    instance: trip
  };
}

export function assembleGroupStatus(state, groupId) {
  const groupStatus = instanceStatus(state, 'groups', { id: Number(groupId) });
  const group = _.clone(groupStatus.instance);

  const experienceStatus = group ?
    instanceStatus(state, 'experiences', { id: group.experienceId }) : null;

  const scriptStatus = group ?
    instanceStatus(state, 'scripts', { id: group.scriptId }) : null;

  if (group &&
      scriptStatus &&
      scriptStatus.instance &&
      experienceStatus &&
      experienceStatus.instance) {
    const departures = scriptStatus.instance.content.departures;
    const departureNames = _.map(departures, 'name');
    const tripIds = _(state.datastore.trips)
      .filter({ groupId: group.id, isArchived: false })
      .sortBy([trip => departureNames.indexOf(trip.departureName), 'id'])
      .map('id')
      .value();
    const tripsStatuses = _.map(tripIds, id => assembleTripStatus(state, id));
    _.assign(group, {
      tripIds: tripIds,
      trips: _.map(tripsStatuses, 'instance').filter(Boolean),
      script: scriptStatus.instance,
      experience: experienceStatus.instance
    });
  }
  const isLoading = (
    groupStatus.isLoading ||
    !scriptStatus ||
    scriptStatus.isLoading ||
    !experienceStatus ||
    experienceStatus.isLoading
  );
  const isError = (
    groupStatus.isError ||
    (scriptStatus && scriptStatus.isError) ||
    (experienceStatus && experienceStatus.isError)
  );
  return {
    isLoading: isLoading,
    isError: isError,
    instance: group
  };
}

export function assemblePlayerStatus(state, tripId, roleName) {
  const tripStatus = assembleTripStatus(state, tripId);
  const trip = tripStatus.instance;
  const players = trip ? trip.players : [];
  const player = _.find(players, { roleName: roleName });
  return {
    isLoading: tripStatus.isLoading,
    isError: tripStatus.isError,
    instance: player
  };
}
