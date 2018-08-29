import { connect } from 'react-redux';

import { assembleGroupStatus } from '../../../connector-utils';
import { updateInstance } from '../../../actions';
import GroupPlayers from '../components/GroupPlayers';

const mapStateToProps = (state, ownProps) => ({
  groupStatus: assembleGroupStatus(state, ownProps.params.groupId),
  users: state.datastore.users,
  profiles: state.datastore.profiles
});

const mapDispatchToProps = dispatch => ({
  updateInstance: (...args) => dispatch(updateInstance(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(GroupPlayers);
