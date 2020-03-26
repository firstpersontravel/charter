import _ from 'lodash';
import { connect } from 'react-redux';

import { postAdminAction } from '../../actions';
import { lookupTrip } from './utils';
import TripControls from '../components/TripControls';

const mapStateToProps = (state, ownProps) => ({
  nextAction: _(state.datastore.actions)
    .filter({
      tripId: Number(ownProps.match.params.tripId),
      appliedAt: null,
      failedAt: null
    })
    .sortBy('scheduledAt')
    .first(),
  trip: lookupTrip(state, ownProps)
});

const mapDispatchToProps = dispatch => ({
  postAdminAction: (...args) => dispatch(postAdminAction(...args))
});


export default connect(mapStateToProps, mapDispatchToProps)(TripControls);
