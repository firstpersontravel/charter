import { connect } from 'react-redux';

import { lookupOrg, lookupExperience, lookupActiveTrips, lookupUpcomingActions, lookupMessages } from './utils';
import ActiveTripsAll from '../components/ActiveTripsAll';

const mapStateToProps = (state, ownProps) => {
  const upcomingActions = lookupUpcomingActions(state, ownProps);
  const msgFilter = { isReplyNeeded: true, replyReceivedAt: null };
  const messagesNeedingReply = lookupMessages(state, ownProps, 10, msgFilter);
  const numMessagesNeedingReply = messagesNeedingReply.length;
  return {
    org: lookupOrg(state, ownProps),
    experience: lookupExperience(state, ownProps),
    trips: lookupActiveTrips(state, ownProps),
    nextUnappliedAction: upcomingActions[0],
    numMessagesNeedingReply: numMessagesNeedingReply
  };
};

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(ActiveTripsAll);
