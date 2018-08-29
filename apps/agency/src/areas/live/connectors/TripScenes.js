import { connect } from 'react-redux';

import { postAction, postAdminAction } from '../../../actions';
import { assembleTripStatus } from '../../../connector-utils';
import TripScenes from '../components/TripScenes';

const mapStateToProps = (state, ownProps) => ({
  trip: assembleTripStatus(state, ownProps.params.tripId).instance
});

const mapDispatchToProps = dispatch => ({
  postAction: (...args) => dispatch(postAction(...args)),
  postAdminAction: (...args) => dispatch(postAdminAction(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(TripScenes);
