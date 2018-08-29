import { connect } from 'react-redux';

import { assembleTripStatus } from '../../../connector-utils';
import TripInitiatives from '../components/TripInitiatives';

const mapStateToProps = (state, ownProps) => ({
  trip: assembleTripStatus(state, ownProps.params.tripId).instance
});

export default connect(mapStateToProps)(TripInitiatives);
