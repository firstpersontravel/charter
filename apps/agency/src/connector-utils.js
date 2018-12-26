import _ from 'lodash';

import { EvalCore } from 'fptcore';

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
  const tripStatus = instanceStatus(state, 'trips',
    { id: Number(tripId) });
  const scriptId = _.get(tripStatus, 'instance.scriptId');
  const scriptStatus = instanceStatus(state, 'scripts', { id: scriptId });
  const participantsStatus = instancesStatus(state, 'participants',
    { tripId: Number(tripId) });
  const users = state.datastore.users;
  const trip = _.clone(tripStatus.instance);
  const env = {
    host: `${window.location.protocol}//${window.location.hostname}`
  };
  if (trip) {
    trip.script = scriptStatus.instance;
    const roles = _.get(scriptStatus.instance, 'content.roles') || [];
    trip.participants = _.map(participantsStatus.instances, instance => (
      _.assign({}, instance, {
        trip: trip,
        role: _.find(roles, { name: instance.roleName }),
        user: _.find(users, { id: instance.userId })
      })
    ));
    trip.context = trip.script ? EvalCore.gatherContext(env, trip) : null;
  }
  const isLoading = (
    scriptStatus.isLoading ||
    tripStatus.isLoading ||
    participantsStatus.isLoading
  );
  const isError = (
    scriptStatus.isError ||
    tripStatus.isError ||
    participantsStatus.isError
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
  const scriptStatus = instanceStatus(state, 'scripts',
    { id: group && group.scriptId });
  if (group && scriptStatus.instance) {
    const departures = scriptStatus.instance.content.departures;
    const departureNames = _.map(departures, 'name');
    const tripIds = _(state.datastore.trips)
      .filter({ groupId: group.id })
      .sortBy([trip => departureNames.indexOf(trip.departureName), 'id'])
      .map('id')
      .value();
    const tripsStatuses = _.map(tripIds, id => assembleTripStatus(state, id));
    _.assign(group, {
      tripIds: tripIds,
      trips: _.map(tripsStatuses, 'instance').filter(Boolean),
      script: scriptStatus.instance
    });
  }
  return {
    isLoading: groupStatus.isLoading || scriptStatus.isLoading,
    isError: groupStatus.isError || scriptStatus.isError,
    instance: group
  };
}

export function assembleParticipantStatus(state, tripId, roleName) {
  const tripStatus = assembleTripStatus(state, tripId);
  const trip = tripStatus.instance;
  const participants = trip ? trip.participants : [];
  const participant = _.find(participants, { roleName: roleName });
  return {
    isLoading: tripStatus.isLoading,
    isError: tripStatus.isError,
    instance: participant
  };
}
