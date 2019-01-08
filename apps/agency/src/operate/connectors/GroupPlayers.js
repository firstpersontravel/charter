import { connect } from 'react-redux';

import { lookupGroup } from './utils';
import { updateInstance } from '../../actions';
import GroupPlayers from '../components/GroupPlayers';

const mapStateToProps = (state, ownProps) => ({
  group: lookupGroup(state, ownProps),
  users: state.datastore.users,
  profiles: state.datastore.profiles
});

const mapDispatchToProps = dispatch => ({
  updateInstance: (...args) => dispatch(updateInstance(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(GroupPlayers);
