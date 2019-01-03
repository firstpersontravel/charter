import _ from 'lodash';
import { connect } from 'react-redux';

import Organization from '../components/Organization';
import { logout } from '../../actions';

const mapStateToProps = (state, ownProps) => {
  const organizationName = ownProps.params.organizationName;
  const authInfo = _.get(_.find(state.datastore.auth, { id: 'latest' }),
    'data');
  return {
    authInfo: authInfo,
    organizationName: organizationName,
    organization: _.find(authInfo.organizations, { name: organizationName })
  };
};

const mapDispatchToProps = dispatch => ({
  logout: (...args) => dispatch(logout(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(Organization);
