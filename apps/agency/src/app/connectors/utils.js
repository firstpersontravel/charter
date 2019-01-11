import {
  instanceIncluder,
  instancesFromDatastore
} from '../../datastore-utils';

export function lookupExperiences(state, ownProps) {
  return instancesFromDatastore(state, {
    col: 'experiences',
    sort: exp => exp.title.toLowerCase(),
    filter: { org: { name: ownProps.params.orgName } },
    include: { org: instanceIncluder('orgs', 'id', 'orgId') }
  });
}