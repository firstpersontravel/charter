import { connect } from 'react-redux';

import { lookupTrip } from '../../operate/connectors/utils';
import {
  createInstance,
  createInstances,
  updateInstance
} from '../../actions';
import TripPlayers from '../components/TripPlayers';

const mapStateToProps = (state, ownProps) => ({
  trip: lookupTrip(state, ownProps),
  participants: state.datastore.participants,
  profiles: state.datastore.profiles
});

const mapDispatchToProps = dispatch => ({
  createInstance: (...args) => dispatch(createInstance(...args)),
  createInstances: (...args) => dispatch(createInstances(...args)),
  updateInstance: (...args) => dispatch(updateInstance(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(TripPlayers);
