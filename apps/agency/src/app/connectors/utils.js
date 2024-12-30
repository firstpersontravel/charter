import {
  instanceIncluder,
  instancesIncluder,
  instancesFromDatastore
} from '../../datastore-utils';

export function lookupExperiences(state, ownProps) {
  return instancesFromDatastore(state, {
    col: 'experiences',
    sort: exp => exp.title.toLowerCase(),
    filter: {
      org: { name: ownProps.match.params.orgName },
      isArchived: false
    },
    include: { org: instanceIncluder('orgs', 'id', 'orgId') }
  });
}

export function lookupActiveTripss(state, ownProps) {
  return instancesFromDatastore(state, {
    col: 'groups',
    sort: 'date',
    filter: {
      experience: { name: ownProps.match.params.experienceName },
      isArchived: false
    },
    include: {
      experience: instanceIncluder('experiences', 'id', 'experienceId'),
      trips: instancesIncluder('trips', 'groupId', 'id')
    }
  });
}
