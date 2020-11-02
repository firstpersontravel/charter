import _ from 'lodash';
import { connect } from 'react-redux';

import Experience from '../components/Experience';
import { listCollection } from '../../actions';

const mapStateToProps = (state, ownProps) => {
  const authInfo = _.get(_.find(state.datastore.auth, { id: 'latest' }), 'data');
  const experienceRequest = state.requests['experiences.list'];
  const experienceName = ownProps.match.params.experienceName;
  return {
    org: _.find(authInfo.orgs, { name: ownProps.match.params.orgName }),
    experienceName: experienceName,
    experienceRequest: experienceRequest,
    experience: _.find(state.datastore.experiences, { name: experienceName })
  };
};

const mapDispatchToProps = dispatch => ({
  listCollection: (...args) => dispatch(listCollection(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(Experience);
