import { connect } from 'react-redux';

import TripAchievements from '../components/TripAchievements';
import { lookupTrip } from './utils';

const mapStateToProps = (state, ownProps) => ({
  trip: lookupTrip(state, ownProps)
});

export default connect(mapStateToProps)(TripAchievements);
