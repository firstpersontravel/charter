import _ from 'lodash';
import { connect } from 'react-redux';

import { assembleGroupStatus } from '../../../connector-utils';
import { refreshLiveData } from '../../../actions';
import Group from '../components/Group';

const mapStateToProps = (state, ownProps) => {
  const groupStatus = assembleGroupStatus(state, ownProps.params.groupId);
  const tripIds = _.get(groupStatus, 'instance.tripIds');
  const nextUnappliedAction = _(state.datastore.actions)
    .filter(action => _.includes(tripIds, action.playthroughId))
    .filter({ appliedAt: null, failedAt: null })
    .sortBy('scheduledAt')
    .head();
  return {
    areRequestsPending: _.some(state.requests, v => v === 'pending'),
    groupStatus: groupStatus,
    nextUnappliedAction: nextUnappliedAction
  };
};

const mapDispatchToProps = dispatch => ({
  refreshLiveData: (...args) => dispatch(refreshLiveData(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(Group);
