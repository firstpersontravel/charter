import _ from 'lodash';
import { connect } from 'react-redux';

import { instanceFromDatastore } from '../../datastore-utils';
import {
  bulkUpdate,
  createInstance,
  updateInstance,
  createTrip,
  listCollection,
  trackEvent
} from '../../actions';
import { lookupActiveTrips } from './utils';
import Group from '../components/Group';

const mapStateToProps = (state, ownProps) => ({
  org: _.find(state.datastore.orgs, { name: ownProps.match.params.orgName }),
  experience: instanceFromDatastore(state, {
    col: 'experiences',
    filter: { name: ownProps.match.params.experienceName }
  }),
  group: lookupActiveTrips(state, ownProps),
  participants: state.datastore.participants,
  profiles: state.datastore.profiles
});

const mapDispatchToProps = dispatch => ({
  bulkUpdate: (...args) => dispatch(bulkUpdate(...args)),
  createTrip: (...args) => dispatch(createTrip(...args)),
  createInstance: (...args) => dispatch(createInstance(...args)),
  updateInstance: (...args) => dispatch(updateInstance(...args)),
  listCollection: (...args) => dispatch(listCollection(...args)),
  trackEvent: (...args) => dispatch(trackEvent(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(Group);
