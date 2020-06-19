import { connect } from 'react-redux';

import PublicResetPassword from '../components/PublicResetPassword';
import { resetPassword } from '../../actions';

const mapStateToProps = state => ({
  resetPasswordRequest: state.requests['auth.resetPassword'],
  resetPasswordError: state.requestErrors['auth.resetPassword']
});

const mapDispatchToProps = dispatch => ({
  resetPassword: (...args) => dispatch(resetPassword(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(
  PublicResetPassword);
