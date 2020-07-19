import { connect } from 'react-redux';

import App from '../components/App';
import { latestAuthData } from '../../datastore-utils';
import { crash, fetchAuthInfo } from '../../actions';

const mapStateToProps = state => ({
  authInfo: latestAuthData(state),
  globalError: state.globalError
});

const mapDispatchToProps = dispatch => ({
  crash: (...args) => dispatch(crash(...args)),
  fetchAuthInfo: (...args) => dispatch(fetchAuthInfo(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
