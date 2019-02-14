import _ from 'lodash';

import {
  instanceIncluder,
  instanceFromDatastore,
  instancesFromDatastore
} from '../../datastore-utils';

function getExperienceActiveScript(state, instance) {
  return _.find(state.datastore.scripts, {
    isActive: true,
    isArchived: false,
    experienceId: instance.id
  });
}

export function lookupExperience(state, ownProps) {
  return instanceFromDatastore(state, {
    col: 'experiences',
    filter: { name: ownProps.params.experienceName },
    include: {
      org: instanceIncluder('orgs', 'id', 'orgId'),
      script: getExperienceActiveScript
    }
  });
}

export function lookupUsers(state, ownProps) {
  return instancesFromDatastore(state, {
    col: 'users',
    filter: { experience: { name: ownProps.params.experienceName } },
    include: {
      experience: instanceIncluder('experiences', 'id', 'experienceId')
    }
  });
}

function getProfileRole(state, instance) {
  const script = _.find(state.datastore.scripts, {
    experienceId: instance.experienceId,
    isActive: true
  });
  if (!script) {
    return null;
  }
  const role = _.find(script.content.roles, { name: instance.roleName });
  return role;
}

export function lookupProfiles(state, ownProps) {
  return instancesFromDatastore(state, {
    col: 'profiles',
    filter: { experience: { name: ownProps.params.experienceName } },
    include: {
      experience: instanceIncluder('experiences', 'id', 'experienceId', {
        script: getExperienceActiveScript
      }),
      user: instanceIncluder('users', 'id', 'userId'),
      role: getProfileRole
    }
  });
}
