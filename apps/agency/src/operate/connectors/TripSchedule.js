import { connect } from 'react-redux';

import { lookupTrip } from './utils';
import { postAdminAction, updateInstance } from '../../actions';
import TripSchedule from '../components/TripSchedule';

const mapStateToProps = (state, ownProps) => ({
  trip: lookupTrip(state, ownProps)
});

const mapDispatchToProps = dispatch => ({
  updateInstance: (...args) => dispatch(updateInstance(...args)),
  postAdminAction: (...args) => dispatch(postAdminAction(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(TripSchedule);
