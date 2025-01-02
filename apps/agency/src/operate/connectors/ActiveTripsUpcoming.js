import { connect } from 'react-redux';

import { lookupActiveTrips, lookupUpcomingActions } from './utils';
import { postAdminAction, updateInstance } from '../../actions';
import ActiveTripsUpcoming from '../components/ActiveTripsUpcoming';

const mapStateToProps = (state, ownProps) => {
  const trips = lookupActiveTrips(state, ownProps);
  return {
    trips: trips,
    actions: lookupUpcomingActions(state, ownProps)
  };
};

const mapDispatchToProps = dispatch => ({
  postAdminAction: (...args) => dispatch(postAdminAction(...args)),
  updateInstance: (...args) => dispatch(updateInstance(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(ActiveTripsUpcoming);
