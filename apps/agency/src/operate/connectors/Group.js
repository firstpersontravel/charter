import _ from 'lodash';
import { connect } from 'react-redux';

import { assembleGroupStatus } from '../../connector-utils';
import { retrieveInstance, refreshLiveData, listCollection } from '../../actions';
import Group from '../components/Group';

const mapStateToProps = (state, ownProps) => {
  const authData = _.find(state.datastore.auth, { id: 'latest' }).data;
  const org = _.find(authData.orgs, { name: ownProps.params.orgName });
  const groupStatus = assembleGroupStatus(state, ownProps.params.groupId);
  const tripIds = _.get(groupStatus, 'instance.tripIds');
  const nextUnappliedAction = _(state.datastore.actions)
    .filter(action => _.includes(tripIds, action.tripId))
    .filter({ appliedAt: null, failedAt: null })
    .sortBy('scheduledAt')
    .head();
  return {
    org: org,
    areRequestsPending: _.some(state.requests, v => v === 'pending'),
    groupStatus: groupStatus,
    nextUnappliedAction: nextUnappliedAction
  };
};

const mapDispatchToProps = dispatch => ({
  retrieveInstance: (...args) => dispatch(retrieveInstance(...args)),
  listCollection: (...args) => dispatch(listCollection(...args)),
  refreshLiveData: (...args) => dispatch(refreshLiveData(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(Group);
