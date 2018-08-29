import { connect } from 'react-redux';

import { createInstance, listCollection, updateInstance, initializePlaythrough }
  from '../../../actions';
import { instancesStatus } from '../../../connector-utils';
import ScheduleIndex from '../components/schedule-index';

const mapStateToProps = (state, ownProps) => {
  const groupsStatus = instancesStatus(state, 'groups', {
    isArchived: false
  });
  const playthroughsStatus = instancesStatus(state, 'playthroughs', {
    isArchived: false
  });
  return {
    scripts: state.datastore.scripts,
    users: state.datastore.users,
    profiles: state.datastore.profiles,
    groupsStatus: groupsStatus,
    playthroughsStatus: playthroughsStatus
  };
};

const mapDispatchToProps = dispatch => ({
  initializePlaythrough: (...args) => dispatch(initializePlaythrough(...args)),
  createInstance: (...args) => dispatch(createInstance(...args)),
  listCollection: (...args) => dispatch(listCollection(...args)),
  updateInstance: (...args) => dispatch(updateInstance(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(ScheduleIndex);
