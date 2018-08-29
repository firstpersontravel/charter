import { connect } from 'react-redux';

import { assembleTripStatus } from '../../../connector-utils';
import { postAdminAction, updateInstance } from '../../../actions';
import TripValues from '../components/TripValues';

const mapStateToProps = (state, ownProps) => ({
  tripStatus: assembleTripStatus(state, ownProps.params.tripId)
});

const mapDispatchToProps = dispatch => ({
  updateInstance: (...args) => dispatch(updateInstance(...args)),
  postAdminAction: (...args) => dispatch(postAdminAction(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(TripValues);
