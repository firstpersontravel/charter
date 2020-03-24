import _ from 'lodash';
import { connect } from 'react-redux';

import PublicSignup from '../components/PublicSignup';
import { signup } from '../../actions';

const mapStateToProps = state => ({
  authInfo: _.get(_.find(state.datastore.auth, { id: 'latest' }), 'data'),
  signupRequest: state.requests['auth.signup'],
  signupError: state.requestErrors['auth.signup']
});

const mapDispatchToProps = dispatch => ({
  signup: (...args) => dispatch(signup(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(PublicSignup);
