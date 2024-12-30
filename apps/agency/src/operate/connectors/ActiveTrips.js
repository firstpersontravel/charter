import _ from 'lodash';
import { connect } from 'react-redux';

import { lookupOrg, lookupExperience, lookupScript, lookupActiveTrips } from './utils';
import { refreshLiveData, listCollection } from '../../actions';
import ActiveTrips from '../components/ActiveTrips';

const mapStateToProps = (state, ownProps) => {
  const trips = lookupActiveTrips(state, ownProps);
  const tripIds = _.map(trips, 'id');
  const nextUnappliedAction = _(state.datastore.actions)
    .filter(action => _.includes(tripIds, action.tripId))
    .filter({ appliedAt: null, failedAt: null })
    .sortBy('scheduledAt')
    .head();
  return {
    org: lookupOrg(state, ownProps),
    experience: lookupExperience(state, ownProps),
    script: lookupScript(state, ownProps),
    areRequestsPending: _.some(state.requests, v => v === 'pending'),
    trips: trips,
    nextUnappliedAction: nextUnappliedAction
  };
};

const mapDispatchToProps = dispatch => ({
  listCollection: (...args) => dispatch(listCollection(...args)),
  refreshLiveData: (...args) => dispatch(refreshLiveData(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(ActiveTrips);
