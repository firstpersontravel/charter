import {
  instanceIncluder,
  instanceFromDatastore,
  instancesFromDatastore
} from '../../datastore-utils';

export function lookupScript(state, ownProps) {
  return instanceFromDatastore(state, {
    col: 'scripts',
    filter: {
      isArchived: false,
      org: { name: ownProps.params.orgName },
      experience: { name: ownProps.params.experienceName },
      revision: Number(ownProps.params.revision)
    },
    include: {
      org: instanceIncluder('orgs', 'id', 'orgId'),
      experience: instanceIncluder('experiences', 'id', 'experienceId')
    }
  });
}

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

export function lookupAssets(state, ownProps) {
  return instancesFromDatastore(state, {
    col: 'assets',
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
