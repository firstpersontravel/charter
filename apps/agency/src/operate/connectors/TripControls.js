import _ from 'lodash';
import { connect } from 'react-redux';

import { postAdminAction } from '../../actions';
import { assembleTripStatus } from '../../connector-utils';
import TripControls from '../components/TripControls';

const mapStateToProps = (state, ownProps) => ({
  systemActionRequestState: state.requests['system.action'],
  systemActionRequestError: state.requestErrors['system.action'],
  nextAction: _(state.datastore.actions)
    .filter({
      tripId: Number(ownProps.params.tripId),
      appliedAt: null,
      failedAt: null
    })
    .sortBy('scheduledAt')
    .first(),
  trip: assembleTripStatus(state, ownProps.params.tripId).instance
});

const mapDispatchToProps = dispatch => ({
  postAdminAction: (...args) => dispatch(postAdminAction(...args))
});


export default connect(mapStateToProps, mapDispatchToProps)(TripControls);
