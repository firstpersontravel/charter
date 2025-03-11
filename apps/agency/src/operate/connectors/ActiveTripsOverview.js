import { connect } from 'react-redux';

import {
  lookupOrg, lookupExperience, lookupScript, lookupDirections, lookupActiveTrips
} from './utils';
import ActiveTripsOverview from '../components/ActiveTripsOverview';

const mapStateToProps = (state, ownProps) => ({
  org: lookupOrg(state, ownProps),
  experience: lookupExperience(state, ownProps),
  script: lookupScript(state, ownProps),
  trips: lookupActiveTrips(state, ownProps),
  directions: lookupDirections(state, ownProps)
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(ActiveTripsOverview);
