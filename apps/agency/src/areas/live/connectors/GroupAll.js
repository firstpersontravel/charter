import _ from 'lodash';
import moment from 'moment';
import { connect } from 'react-redux';

import { assembleGroupStatus } from '../../../connector-utils';
import { getMessagesNeedingReply } from '../utils';
import GroupAll from '../components/GroupAll';

const mapStateToProps = (state, ownProps) => {
  const groupStatus = assembleGroupStatus(state, ownProps.params.groupId);
  const tripIds = _.get(groupStatus, 'instance.tripIds');
  const messagesNeedingReply = getMessagesNeedingReply(
    state, ownProps.params.groupId);
  const nextUnappliedAction = _(state.datastore.actions)
    .filter(action => _.includes(tripIds, action.playthroughId))
    .filter({ isArchived: false, appliedAt: null, failedAt: null })
    .filter(action => moment.utc(action.scheduledAt).isAfter())
    .sortBy('scheduledAt')
    .head();
  return {
    groupStatus: groupStatus,
    nextUnappliedAction: nextUnappliedAction,
    numMessagesNeedingReply: messagesNeedingReply.length
  };
};

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(GroupAll);
