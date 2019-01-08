import { connect } from 'react-redux';

import TripIndex from '../components/TripIndex';
import { lookupTrip } from './utils';

const mapStateToProps = (state, ownProps) => ({
  trip: lookupTrip(state, ownProps)
});

export default connect(mapStateToProps)(TripIndex);
