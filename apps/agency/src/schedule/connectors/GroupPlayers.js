import { connect } from 'react-redux';

import { lookupActiveTrips } from '../../operate/connectors/utils';
import {
  createInstance,
  createInstances,
  updateInstance
} from '../../actions';
import GroupPlayers from '../components/GroupPlayers';

const mapStateToProps = (state, ownProps) => ({
  group: lookupActiveTrips(state, ownProps),
  participants: state.datastore.participants,
  profiles: state.datastore.profiles
});

const mapDispatchToProps = dispatch => ({
  createInstance: (...args) => dispatch(createInstance(...args)),
  createInstances: (...args) => dispatch(createInstances(...args)),
  updateInstance: (...args) => dispatch(updateInstance(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(GroupPlayers);
