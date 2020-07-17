import { connect } from 'react-redux';

import App from '../components/App';
import { crash, fetchAuthInfo } from '../../actions';

const mapStateToProps = state => ({
  globalError: state.globalError
});

const mapDispatchToProps = dispatch => ({
  crash: (...args) => dispatch(crash(...args)),
  fetchAuthInfo: (...args) => dispatch(fetchAuthInfo(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
