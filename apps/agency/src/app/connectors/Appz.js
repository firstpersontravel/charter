import { connect } from 'react-redux';

import App from '../components/app';
import { fetchAuthInfo, listCollection } from '../../actions';

const mapStateToProps = state => ({});

const mapDispatchToProps = dispatch => ({
  fetchAuthInfo: (...args) => dispatch(fetchAuthInfo(...args)),
  listCollection: (...args) => dispatch(listCollection(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
