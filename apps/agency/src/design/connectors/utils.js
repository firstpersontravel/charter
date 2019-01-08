import {
  instanceIncluder,
  instanceFromDatastore
} from '../../datastore-utils';

export function lookupScript(state, ownProps) {
  return instanceFromDatastore(state, {
    col: 'scripts',
    filter: {
      isArchived: false,
      org: { name: ownProps.params.orgName },
      experience: { name: ownProps.params.experienceName },
      id: Number(ownProps.params.scriptId)
    },
    include: {
      org: instanceIncluder('orgs', 'id', 'orgId'),
      experience: instanceIncluder('experiences', 'id', 'experienceId')
    }
  });
}
