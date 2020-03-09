import { connect } from 'react-redux';

import { lookupGroup, lookupUpcomingActions } from './utils';
import GroupAll from '../components/GroupAll';

const mapStateToProps = (state, ownProps) => {
  const group = lookupGroup(state, ownProps);
  const upcomingActions = lookupUpcomingActions(state, ownProps);
  return {
    group: group,
    nextUnappliedAction: upcomingActions[0]
  };
};

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(GroupAll);
