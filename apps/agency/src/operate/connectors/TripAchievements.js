import { connect } from 'react-redux';

import { assembleTripStatus } from '../../connector-utils';
import TripAchievements from '../components/TripAchievements';

const mapStateToProps = (state, ownProps) => ({
  trip: assembleTripStatus(state, ownProps.params.tripId).instance
});

export default connect(mapStateToProps)(TripAchievements);
