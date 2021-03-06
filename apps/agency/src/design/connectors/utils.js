import {
  instanceIncluder,
  instanceFromDatastore,
  instancesFromDatastore
} from '../../datastore-utils';

export function lookupExperience(state, ownProps) {
  return instanceFromDatastore(state, {
    col: 'experiences',
    filter: {
      isArchived: false,
      name: ownProps.match.params.experienceName,
      org: { name: ownProps.match.params.orgName }
    },
    include: { org: instanceIncluder('orgs', 'id', 'orgId') }
  });
}

export function lookupExperiences(state, ownProps) {
  return instancesFromDatastore(state, {
    col: 'experiences',
    filter: {
      isArchived: false,
      org: { name: ownProps.match.params.orgName }
    },
    include: { org: instanceIncluder('orgs', 'id', 'orgId') }
  });
}

export function lookupScript(state, ownProps) {
  return instanceFromDatastore(state, {
    col: 'scripts',
    filter: {
      isArchived: false,
      org: { name: ownProps.match.params.orgName },
      experience: {
        name: ownProps.match.params.experienceName,
        isArchived: false
      },
      revision: Number(ownProps.match.params.revision)
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
      org: { name: ownProps.match.params.orgName },
      experience: {
        name: ownProps.match.params.experienceName,
        isArchived: false
      }
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
      org: { name: ownProps.match.params.orgName },
      experience: { name: ownProps.match.params.experienceName }
    },
    include: {
      org: instanceIncluder('orgs', 'id', 'orgId'),
      experience: instanceIncluder('experiences', 'id', 'experienceId')
    }
  });
}
