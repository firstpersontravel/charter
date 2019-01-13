import _ from 'lodash';
import { connect } from 'react-redux';

import Org from '../components/Org';
import { logout, listCollection } from '../../actions';

const mapStateToProps = (state, ownProps) => {
  const orgName = ownProps.params.orgName;
  const authInfo = _.get(_.find(state.datastore.auth, { id: 'latest' }),
    'data');
  const org = _.find(state.datastore.orgs, { name: orgName });
  return {
    authInfo: authInfo,
    orgName: orgName,
    org: org
  };
};

const mapDispatchToProps = dispatch => ({
  listCollection: (...args) => dispatch(listCollection(...args)),
  logout: (...args) => dispatch(logout(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(Org);
