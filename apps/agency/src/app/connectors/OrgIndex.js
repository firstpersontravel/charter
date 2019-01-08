import _ from 'lodash';
import { connect } from 'react-redux';

import {
  instanceIncluder,
  instancesFromDatastore
} from '../../datastore-utils';
import OrgIndex from '../components/OrgIndex';

const mapStateToProps = (state, ownProps) => {
  const orgName = ownProps.params.orgName;
  const authInfo = _.get(_.find(state.datastore.auth, { id: 'latest' }),
    'data');
  const org = _.find(authInfo.orgs, { name: orgName });
  const experiences = instancesFromDatastore(state, {
    col: 'experiences',
    filter: { isArchived: false, org: { name: orgName } },
    include: { org: instanceIncluder('orgs', 'id', 'orgId') }
  });
  return {
    authInfo: authInfo,
    orgName: orgName,
    org: org,
    experiences: experiences
  };
};

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(OrgIndex);
