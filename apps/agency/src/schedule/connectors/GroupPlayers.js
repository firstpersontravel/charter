import { connect } from 'react-redux';

import { lookupGroup } from '../../operate/connectors/utils';
import { createInstance, updateInstance } from '../../actions';
import GroupPlayers from '../components/GroupPlayers';

const mapStateToProps = (state, ownProps) => ({
  group: lookupGroup(state, ownProps),
  users: state.datastore.users,
  profiles: state.datastore.profiles
});

const mapDispatchToProps = dispatch => ({
  createInstance: (...args) => dispatch(createInstance(...args)),
  updateInstance: (...args) => dispatch(updateInstance(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(GroupPlayers);
