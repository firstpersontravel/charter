import { connect } from 'react-redux';

import PublicLostPassword from '../components/PublicLostPassword';
import { lostPassword } from '../../actions';

const mapStateToProps = state => ({
  lostPasswordRequest: state.requests['auth.lostPassword'],
  lostPasswordError: state.requestErrors['auth.lostPassword']
});

const mapDispatchToProps = dispatch => ({
  lostPassword: (...args) => dispatch(lostPassword(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(
  PublicLostPassword);
