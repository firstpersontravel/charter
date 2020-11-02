import { connect } from 'react-redux';

import { lookupGroup, lookupUpcomingActions, lookupMessages } from './utils';
import GroupAll from '../components/GroupAll';

const mapStateToProps = (state, ownProps) => {
  const group = lookupGroup(state, ownProps);
  const upcomingActions = lookupUpcomingActions(state, ownProps);
  const msgFilter = { isReplyNeeded: true, replyReceivedAt: null };
  const messagesNeedingReply = lookupMessages(state, ownProps, 10, msgFilter);
  const numMessagesNeedingReply = messagesNeedingReply.length;
  return {
    group: group,
    nextUnappliedAction: upcomingActions[0],
    numMessagesNeedingReply: numMessagesNeedingReply
  };
};

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(GroupAll);
