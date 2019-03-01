import _ from 'lodash';
import { connect } from 'react-redux';

import { instanceFromDatastore } from '../../datastore-utils';
import {
  createInstance,
  updateInstance,
  initializeTrip,
  listCollection
} from '../../actions';
import { lookupGroup } from './utils';
import ScheduleGroup from '../components/ScheduleGroup';

const mapStateToProps = (state, ownProps) => ({
  org: _.find(state.datastore.orgs, { name: ownProps.params.orgName }),
  experience: instanceFromDatastore(state, {
    col: 'experiences',
    filter: { name: ownProps.params.experienceName }
  }),
  group: lookupGroup(state, ownProps),
  users: state.datastore.users,
  profiles: state.datastore.profiles
});

const mapDispatchToProps = dispatch => ({
  initializeTrip: (...args) => dispatch(initializeTrip(...args)),
  createInstance: (...args) => dispatch(createInstance(...args)),
  updateInstance: (...args) => dispatch(updateInstance(...args)),
  listCollection: (...args) => dispatch(listCollection(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(ScheduleGroup);
