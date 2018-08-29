import _ from 'lodash';
import moment from 'moment';
import { connect } from 'react-redux';

import { assembleGroupStatus } from '../../../connector-utils';
import { postAdminAction, updateInstance } from '../../../actions';
import GroupUpcoming from '../components/GroupUpcoming';

const mapStateToProps = (state, ownProps) => {
  const groupStatus = assembleGroupStatus(state, ownProps.params.groupId);
  const tripIds = _.get(groupStatus, 'instance.tripIds') || [];
  // Filter actions by those greater than an hour ago -- to allow
  // some time to unarchive archived actions.
  const oneHourAgo = moment.utc().subtract(1, 'hours');
  const actions = _(state.datastore.actions)
    .filter(action => _.includes(tripIds, action.playthroughId))
    .filter({ appliedAt: null, failedAt: null })
    .filter(action => moment.utc(action.scheduledAt).isAfter(oneHourAgo))
    .value();
  return {
    groupStatus: groupStatus,
    actions: actions
  };
};

const mapDispatchToProps = dispatch => ({
  postAdminAction: (...args) => dispatch(postAdminAction(...args)),
  updateInstance: (...args) => dispatch(updateInstance(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(GroupUpcoming);
