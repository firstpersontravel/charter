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
      org: { name: ownProps.params.orgName },
      experience: { name: ownProps.params.experienceName }
    },
    include: {
      org: instanceIncluder('orgs', 'id', 'orgId'),
      experience: instanceIncluder('experiences', 'id', 'experienceId')
    }
  });
}

export function lookupGroups(state, ownProps) {
  return instancesFromDatastore(state, {
    col: 'groups',
    filter: {
      org: { name: ownProps.params.orgName },
      experience: { name: ownProps.params.experienceName }
    },
    include: {
      org: instanceIncluder('orgs', 'id', 'orgId'),
      experience: instanceIncluder('experiences', 'id', 'experienceId')
    }
  });
}

export function lookupGroup(state, ownProps) {
  return instanceFromDatastore(state, {
    col: 'groups',
    filter: { id: Number(ownProps.params.groupId) },
    include: {
      org: instanceIncluder('orgs', 'id', 'orgId'),
      experience: instanceIncluder('experiences', 'id', 'experienceId'),
      script: instanceIncluder('scripts', 'id', 'scriptId'),
      trips: instancesIncluder('trips', 'groupId', 'id', { isArchived: false })
    }
  });
}
