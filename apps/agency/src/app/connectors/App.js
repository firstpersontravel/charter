import { connect } from 'react-redux';

import App from '../components/App';
import { crash, fetchAuthInfo } from '../../actions';

const mapStateToProps = state => ({
  hasError: (
    state.globalError !== null ||
    Object
      .keys(state.requestErrors)
      .filter(key => !key.startsWith('auth.'))
      .length > 0)
});

const mapDispatchToProps = dispatch => ({
  crash: (...args) => dispatch(crash(...args)),
  fetchAuthInfo: (...args) => dispatch(fetchAuthInfo(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
