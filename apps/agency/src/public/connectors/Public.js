import _ from 'lodash';
import { connect } from 'react-redux';

import Public from '../components/Public';
import { logout } from '../../actions';

const mapStateToProps = state => ({
  authInfo: _.find(state.datastore.auth, { id: 'latest' })
});

const mapDispatchToProps = dispatch => ({
  logout: (...args) => dispatch(logout(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(Public);
