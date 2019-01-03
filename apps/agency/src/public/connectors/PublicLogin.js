import _ from 'lodash';
import { connect } from 'react-redux';

import PublicLogin from '../components/PublicLogin';
import { fetchAuthInfo, login } from '../../actions';

const mapStateToProps = state => ({
  authInfo: _.get(_.find(state.datastore.auth, { id: 'latest' }), 'data'),
  loginRequest: state.requests['auth.login']
});

const mapDispatchToProps = dispatch => ({
  fetchAuthInfo: (...args) => dispatch(fetchAuthInfo(...args)),
  login: (...args) => dispatch(login(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(PublicLogin);
