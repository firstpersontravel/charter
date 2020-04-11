import moment from 'moment';
import {
  instanceIncluder,
  instancesIncluder,
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

export function isGroupInMonth(group, year, month) {
  const thisMonth = moment(`${year}-${month}-01`, 'YYYY-MM-DD');
  const nextMonth = thisMonth.clone().add(1, 'months');
  return (
    moment(group.date).isSameOrAfter(thisMonth) &&
    moment(group.date).isBefore(nextMonth)
  );
}

export function lookupGroups(state, ownProps) {
  const year = ownProps.match.params.year;
  const month = ownProps.match.params.month;
  const query = new URLSearchParams(ownProps.location.search);
  const showArchived = query.get('archived') === 'true';
  const filter = {
    org: { name: ownProps.match.params.orgName },
    experience: { name: ownProps.match.params.experienceName },
    self: group => isGroupInMonth(group, year, month)
  };
  if (!showArchived) {
    filter.isArchived = false;
  }
  return instancesFromDatastore(state, {
    col: 'groups',
    filter: filter,
    include: {
      org: instanceIncluder('orgs', 'id', 'orgId'),
      experience: instanceIncluder('experiences', 'id', 'experienceId'),
      trips: instancesIncluder('trips', 'groupId', 'id')
    }
  });
}

export function lookupGroup(state, ownProps) {
  return instanceFromDatastore(state, {
    col: 'groups',
    filter: { id: Number(ownProps.match.params.groupId) },
    include: {
      org: instanceIncluder('orgs', 'id', 'orgId'),
      experience: instanceIncluder('experiences', 'id', 'experienceId'),
      script: instanceIncluder('scripts', 'id', 'scriptId'),
      trips: instancesIncluder('trips', 'groupId', 'id')
    }
  });
}
