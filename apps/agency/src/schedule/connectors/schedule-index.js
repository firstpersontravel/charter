import { connect } from 'react-redux';

import { createInstance, listCollection, updateInstance, initializeTrip }
  from '../../actions';
import { instancesStatus } from '../../connector-utils';
import ScheduleIndex from '../components/schedule-index';

const mapStateToProps = (state, ownProps) => {
  const groupsStatus = instancesStatus(state, 'groups', {
    isArchived: false
  });
  const tripsStatus = instancesStatus(state, 'trips', {
    isArchived: false
  });
  return {
    experiences: state.datastore.experiences,
    scripts: state.datastore.scripts,
    users: state.datastore.users,
    profiles: state.datastore.profiles,
    groupsStatus: groupsStatus,
    tripsStatus: tripsStatus
  };
};

const mapDispatchToProps = dispatch => ({
  initializeTrip: (...args) => dispatch(initializeTrip(...args)),
  createInstance: (...args) => dispatch(createInstance(...args)),
  listCollection: (...args) => dispatch(listCollection(...args)),
  updateInstance: (...args) => dispatch(updateInstance(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(ScheduleIndex);
