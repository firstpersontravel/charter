import moment from 'moment';
import {
  instanceIncluder,
  instanceFromDatastore,
  instancesFromDatastore
} from '../../datastore-utils';

export function lookupScripts(state, ownProps) {
  return instancesFromDatastore(state, {
    col: 'scripts',
    filter: {
      isArchived: false,
      org: { name: ownProps.match.params.orgName },
      experience: { name: ownProps.match.params.experienceName }
    },
    include: {
      org: instanceIncluder('orgs', 'id', 'orgId'),
      experience: instanceIncluder('experiences', 'id', 'experienceId')
    }
  });
}

function isTripInMonth(trip, year, month) {
  const thisMonth = moment(`${year}-${month}-01`, 'YYYY-MM-DD');
  const nextMonth = thisMonth.clone().add(1, 'months');
  return (
    moment(trip.date).isSameOrAfter(thisMonth) &&
    moment(trip.date).isBefore(nextMonth)
  );
}

export function lookupActiveTripsByDate(state, ownProps, year, month) {
  const query = new URLSearchParams(ownProps.location.search);
  const showArchived = query.get('archived') === 'true';
  const filter = {
    org: { name: ownProps.match.params.orgName },
    experience: { name: ownProps.match.params.experienceName },
    self: trip => isTripInMonth(trip, year, month)
  };
  if (!showArchived) {
    filter.isArchived = false;
  }
  return instancesFromDatastore(state, {
    col: 'trips',
    filter: filter,
    include: {
      org: instanceIncluder('orgs', 'id', 'orgId'),
      experience: instanceIncluder('experiences', 'id', 'experienceId'),
      script: instanceIncluder('scripts', 'id', 'scriptId')
    }
  });
}

export function lookupActiveTrips(state, ownProps) {
  const year = ownProps.match.params.year;
  const month = ownProps.match.params.month;
  return lookupActiveTripsByDate(state, ownProps, year, month);
}

export function lookupTrip(state, ownProps) {
  return instanceFromDatastore(state, {
    col: 'trips',
    filter: {
      id: Number(ownProps.match.params.tripId)
    },
    include: {
      org: instanceIncluder('orgs', 'id', 'orgId'),
      experience: instanceIncluder('experiences', 'id', 'experienceId'),
      script: instanceIncluder('scripts', 'id', 'scriptId')
    }
  });
}

export function lookupScript(state, ownProps) {
  return instanceFromDatastore(state, {
    col: 'scripts',
    filter: {
      org: { name: ownProps.match.params.orgName },
      experience: { name: ownProps.match.params.experienceName },
      isActive: true
    },
    include: {
      org: instanceIncluder('orgs', 'id', 'orgId'),
      experience: instanceIncluder('experiences', 'id', 'experienceId')
    }
  });
}
