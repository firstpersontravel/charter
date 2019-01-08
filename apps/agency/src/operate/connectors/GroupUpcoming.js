import _ from 'lodash';
import moment from 'moment';
import { connect } from 'react-redux';

import { lookupGroup } from './utils';
import { postAdminAction, updateInstance } from '../../actions';
import GroupUpcoming from '../components/GroupUpcoming';

const mapStateToProps = (state, ownProps) => {
  const group = lookupGroup(state, ownProps);
  const tripIds = _.map(group.trips, 'id');
  // Filter actions by those greater than an hour ago -- to allow
  // some time to unarchive archived actions.
  const oneHourAgo = moment.utc().subtract(1, 'hours');
  const actions = _(state.datastore.actions)
    .filter(action => _.includes(tripIds, action.tripId))
    .filter({ appliedAt: null, failedAt: null })
    .filter(action => moment.utc(action.scheduledAt).isAfter(oneHourAgo))
    .value();
  return {
    group: group,
    actions: actions
  };
};

const mapDispatchToProps = dispatch => ({
  postAdminAction: (...args) => dispatch(postAdminAction(...args)),
  updateInstance: (...args) => dispatch(updateInstance(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(GroupUpcoming);
