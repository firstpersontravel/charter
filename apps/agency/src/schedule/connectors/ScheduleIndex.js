import _ from 'lodash';
import { connect } from 'react-redux';

import { createInstance, listCollection, updateInstance, initializeTrip }
  from '../../actions';
import { instancesStatus } from '../../connector-utils';
import ScheduleIndex from '../components/ScheduleIndex';

const mapStateToProps = (state, ownProps) => {
  const groupsStatus = instancesStatus(state, 'groups', {
    isArchived: false
  });
  const tripsStatus = instancesStatus(state, 'trips', {
    isArchived: false
  });
  const authData = _.find(state.datastore.auth, { id: 'latest' }).data;
  return {
    org: _.find(authData.orgs, { name: ownProps.params.orgName }),
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
