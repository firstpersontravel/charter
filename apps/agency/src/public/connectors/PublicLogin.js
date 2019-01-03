import _ from 'lodash';
import { connect } from 'react-redux';

import PublicLogin from '../components/PublicLogin';
import { fetchAuthInfo, login } from '../../actions';

const mapStateToProps = state => ({
  authInfoRequest: state.requests['auth.info'],
  authInfo: _.find(state.datastore.auth, { id: 'latest' }),
  loginRequest: state.requests['auth.login']
});

const mapDispatchToProps = dispatch => ({
  fetchAuthInfo: (...args) => dispatch(fetchAuthInfo(...args)),
  login: (...args) => dispatch(login(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(PublicLogin);
