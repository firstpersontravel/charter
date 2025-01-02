import _ from 'lodash';
import { connect } from 'react-redux';

import { instanceFromDatastore } from '../../datastore-utils';
import {
  createInstance,
  updateInstance,
  listCollection
} from '../../actions';
import { lookupTrip, lookupScript } from './utils';
import Trip from '../components/Trip';

const mapStateToProps = (state, ownProps) => ({
  org: _.find(state.datastore.orgs, { name: ownProps.match.params.orgName }),
  experience: instanceFromDatastore(state, {
    col: 'experiences',
    filter: { name: ownProps.match.params.experienceName }
  }),
  trip: lookupTrip(state, ownProps),
  script: lookupScript(state, ownProps)
});

const mapDispatchToProps = dispatch => ({
  createInstance: (...args) => dispatch(createInstance(...args)),
  updateInstance: (...args) => dispatch(updateInstance(...args)),
  listCollection: (...args) => dispatch(listCollection(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(Trip);
