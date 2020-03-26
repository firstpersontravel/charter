import _ from 'lodash';
import { connect } from 'react-redux';

import Experience from '../components/Experience';
import { lookupExperiences, lookupGroups } from './utils';
import { logout, listCollection } from '../../actions';

const mapStateToProps = (state, ownProps) => {
  const orgName = ownProps.match.params.orgName;
  const authInfo = _.get(_.find(state.datastore.auth, { id: 'latest' }),
    'data');
  const experienceRequest = state.requests['experiences.list'];
  const experienceName = ownProps.match.params.experienceName;
  return {
    authInfo: authInfo,
    experienceName: experienceName,
    experienceRequest: experienceRequest,
    experience: _.find(state.datastore.experiences, { name: experienceName }),
    experiences: lookupExperiences(state, ownProps),
    org: _.find(authInfo.orgs, { name: orgName }),
    groups: lookupGroups(state, ownProps)
  };
};

const mapDispatchToProps = dispatch => ({
  listCollection: (...args) => dispatch(listCollection(...args)),
  logout: (...args) => dispatch(logout(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(Experience);
