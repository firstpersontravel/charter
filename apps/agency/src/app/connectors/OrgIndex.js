import _ from 'lodash';
import { connect } from 'react-redux';

import { createInstance, updateInstance } from '../../actions';
import {
  instanceIncluder,
  instancesFromDatastore,
  latestAuthData
} from '../../datastore-utils';
import OrgIndex from '../components/OrgIndex';

const mapStateToProps = (state, ownProps) => ({
  authInfo: latestAuthData(state),
  org: _.find(state.datastore.orgs, { name: ownProps.params.orgName }),
  experiences: instancesFromDatastore(state, {
    col: 'experiences',
    sort: exp => exp.title.toLowerCase(),
    filter: { org: { name: ownProps.params.orgName } },
    include: { org: instanceIncluder('orgs', 'id', 'orgId') }
  })
});

const mapDispatchToProps = dispatch => ({
  createInstance: (...args) => dispatch(createInstance(...args)),
  updateInstance: (...args) => dispatch(updateInstance(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(OrgIndex);
