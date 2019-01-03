import _ from 'lodash';
import { connect } from 'react-redux';

import Organization from '../components/Organization';
import { logout, listCollection } from '../../actions';

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

const mapDispatchToProps = dispatch => ({
  listCollection: (...args) => dispatch(listCollection(...args)),
  logout: (...args) => dispatch(logout(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(Organization);
