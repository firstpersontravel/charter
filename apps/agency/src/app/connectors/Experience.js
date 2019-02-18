import _ from 'lodash';
import { connect } from 'react-redux';

import Experience from '../components/Experience';
import { lookupExperiences } from './utils';
import { logout, listCollection } from '../../actions';

const mapStateToProps = (state, ownProps) => {
  const orgName = ownProps.params.orgName;
  const authInfo = _.get(_.find(state.datastore.auth, { id: 'latest' }),
    'data');
  const experienceRequest = state.requests['experiences.list'];
  const experienceName = ownProps.params.experienceName;
  return {
    authInfo: authInfo,
    experienceName: experienceName,
    experienceRequest: experienceRequest,
    experience: _.find(state.datastore.experiences, { name: experienceName }),
    experiences: lookupExperiences(state, ownProps),
    org: _.find(authInfo.orgs, { name: orgName })
  };
};

const mapDispatchToProps = dispatch => ({
  listCollection: (...args) => dispatch(listCollection(...args)),
  logout: (...args) => dispatch(logout(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(Experience);
