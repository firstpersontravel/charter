import { connect } from 'react-redux';

import {
  instanceIncluder,
  instancesFromDatastore,
  latestAuthData
} from '../../datastore-utils';
import OrgIndex from '../components/OrgIndex';

const mapStateToProps = (state, ownProps) => ({
  authInfo: latestAuthData(state),
  experiences: instancesFromDatastore(state, {
    col: 'experiences',
    sort: 'title',
    filter: { isArchived: false, org: { name: ownProps.params.orgName } },
    include: { org: instanceIncluder('orgs', 'id', 'orgId') }
  })
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(OrgIndex);
