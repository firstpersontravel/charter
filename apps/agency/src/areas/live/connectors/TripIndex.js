import { connect } from 'react-redux';

import { assembleTripStatus } from '../../../connector-utils';
import TripIndex from '../components/TripIndex';

const mapStateToProps = (state, ownProps) => ({
  tripStatus: assembleTripStatus(state, ownProps.params.tripId)
});

export default connect(mapStateToProps)(TripIndex);
