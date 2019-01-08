import { connect } from 'react-redux';

import { lookupTrip } from './utils';
import Trip from '../components/Trip';

const mapStateToProps = (state, ownProps) => ({
  trip: lookupTrip(state, ownProps)
});

export default connect(mapStateToProps)(Trip);
