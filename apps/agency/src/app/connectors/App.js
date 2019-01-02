import _ from 'lodash';
import { connect } from 'react-redux';

import App from '../components/App';
import { fetchAuthInfo, listCollection, logout } from '../../actions';

const mapStateToProps = state => ({
  authInfo: _.get(_.find(state.datastore.auth, { id: 'latest' }), 'data')
});

const mapDispatchToProps = dispatch => ({
  fetchAuthInfo: (...args) => dispatch(fetchAuthInfo(...args)),
  listCollection: (...args) => dispatch(listCollection(...args)),
  logout: (...args) => dispatch(logout(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
