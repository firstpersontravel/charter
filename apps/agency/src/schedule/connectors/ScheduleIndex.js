import _ from 'lodash';
import { connect } from 'react-redux';

import {
  instanceIncluder,
  instancesIncluder,
  instancesFromDatastore
} from '../../datastore-utils';
import { createInstance, updateInstance, initializeTrip } from '../../actions';
import ScheduleIndex from '../components/ScheduleIndex';

const mapStateToProps = (state, ownProps) => ({
  org: _.find(state.datastore.orgs, { name: ownProps.params.orgName }),
  experience: _.find(state.datastore.experiences, {
    name: ownProps.params.experienceName
  }),
  scripts: instancesFromDatastore(state, {
    col: 'scripts',
    filter: {
      isArchived: false,
      org: { name: ownProps.params.orgName },
      experience: { name: ownProps.params.experienceName }
    },
    include: {
      org: instanceIncluder('orgs', 'id', 'orgId'),
      experience: instanceIncluder('experiences', 'id', 'experienceId')
    }
  }),
  groups: instancesFromDatastore(state, {
    col: 'groups',
    filter: {
      isArchived: false,
      org: { name: ownProps.params.orgName },
      experience: { name: ownProps.params.experienceName }
    },
    include: {
      org: instanceIncluder('orgs', 'id', 'orgId'),
      experience: instanceIncluder('experiences', 'id', 'experienceId'),
      script: instanceIncluder('scripts', 'id', 'scriptId'),
      trips: instancesIncluder('trips', 'groupId', 'id', { isArchived: false })
    }
  }),
  // OLD below
  experiences: state.datastore.experiences,
  users: state.datastore.users,
  profiles: state.datastore.profiles
});

const mapDispatchToProps = dispatch => ({
  initializeTrip: (...args) => dispatch(initializeTrip(...args)),
  createInstance: (...args) => dispatch(createInstance(...args)),
  updateInstance: (...args) => dispatch(updateInstance(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(ScheduleIndex);
