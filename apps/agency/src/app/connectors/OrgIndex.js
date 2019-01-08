import _ from 'lodash';
import { connect } from 'react-redux';

import OrgIndex from '../components/OrgIndex';

const mapStateToProps = (state, ownProps) => {
  const orgName = ownProps.params.orgName;
  const authInfo = _.get(_.find(state.datastore.auth, { id: 'latest' }),
    'data');
  return {
    authInfo: authInfo,
    orgName: orgName,
    org: _.find(authInfo.orgs, { name: orgName })
  };
};

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(OrgIndex);
