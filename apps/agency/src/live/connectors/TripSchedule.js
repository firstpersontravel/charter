import { connect } from 'react-redux';

import { assembleTripStatus } from '../../connector-utils';
import { postAdminAction, updateInstance } from '../../actions';
import TripSchedule from '../components/TripSchedule';

const mapStateToProps = (state, ownProps) => ({
  trip: assembleTripStatus(state, ownProps.params.tripId).instance
});

const mapDispatchToProps = dispatch => ({
  updateInstance: (...args) => dispatch(updateInstance(...args)),
  postAdminAction: (...args) => dispatch(postAdminAction(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(TripSchedule);
