import { connect } from 'react-redux';

import App from '../components/App';
import { fetchAuthInfo } from '../../actions';

const mapStateToProps = state => ({
  hasError: Object.keys(state.requestErrors).length > 0
});

const mapDispatchToProps = dispatch => ({
  fetchAuthInfo: (...args) => dispatch(fetchAuthInfo(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
