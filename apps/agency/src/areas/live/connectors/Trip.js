import { connect } from 'react-redux';

import { assembleTripStatus } from '../../../connector-utils';
import Trip from '../components/Trip';

const mapStateToProps = (state, ownProps) => ({
  tripStatus: assembleTripStatus(state, ownProps.params.tripId)
});

export default connect(mapStateToProps)(Trip);
