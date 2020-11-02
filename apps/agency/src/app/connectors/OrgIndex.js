import _ from 'lodash';
import { connect } from 'react-redux';

import { createInstances, trackEvent } from '../../actions';
import { latestAuthData } from '../../datastore-utils';
import OrgIndex from '../components/OrgIndex';
import { lookupExperiences } from './utils';

const mapStateToProps = (state, ownProps) => ({
  authInfo: latestAuthData(state),
  org: _.find(state.datastore.orgs, { name: ownProps.match.params.orgName }),
  experiences: lookupExperiences(state, ownProps)
});

const mapDispatchToProps = dispatch => ({
  createInstances: (...args) => dispatch(createInstances(...args)),
  trackEvent: (...args) => dispatch(trackEvent(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(OrgIndex);
