import _ from 'lodash';
import moment from 'moment';
import { connect } from 'react-redux';

import { lookupGroup, lookupMessages } from './utils';
import GroupAll from '../components/GroupAll';

const mapStateToProps = (state, ownProps) => {
  const group = lookupGroup(state, ownProps);
  const tripIds = _.map(group.trips, 'id');
  const messagesNeedingReply = lookupMessages(state, ownProps, 10, {
    isReplyNeeded: true,
    replyReceivedAt: null
  });
  return {
    group: group,
    nextUnappliedAction: _(state.datastore.actions)
      .filter(action => _.includes(tripIds, action.tripId))
      .filter({ isArchived: false, appliedAt: null, failedAt: null })
      .filter(action => moment.utc(action.scheduledAt).isAfter())
      .sortBy('scheduledAt')
      .head(),
    numMessagesNeedingReply: messagesNeedingReply.length
  };
};

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(GroupAll);
