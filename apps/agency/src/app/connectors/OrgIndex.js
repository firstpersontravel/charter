import _ from 'lodash';
import { connect } from 'react-redux';

import { createExample, createInstance } from '../../actions';
import {
  latestAuthData
} from '../../datastore-utils';
import OrgIndex from '../components/OrgIndex';
import { lookupExperiences } from './utils';

const mapStateToProps = (state, ownProps) => ({
  authInfo: latestAuthData(state),
  org: _.find(state.datastore.orgs, { name: ownProps.params.orgName }),
  experiences: lookupExperiences(state, ownProps)
});

const mapDispatchToProps = dispatch => ({
  createInstance: (...args) => dispatch(createInstance(...args)),
  createExample: (...args) => dispatch(createExample(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(OrgIndex);
