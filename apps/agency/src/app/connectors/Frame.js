import _ from 'lodash';
import { connect } from 'react-redux';

import Frame from '../components/Frame';
import { lookupExperiences, lookupGroups } from './utils';

const mapStateToProps = (state, ownProps) => {
  const pathParts = ownProps.history.location.pathname.split('/').slice(1);
  const orgName = pathParts[0];
  const experienceName = pathParts[1];
  const groupIdMatch = ownProps.history.location.pathname.match(/operate\/(\d+)/);
  const groupId = groupIdMatch ? Number(groupIdMatch[1]) : null;
  const authInfo = _.get(_.find(state.datastore.auth, { id: 'latest' }), 'data');
  return {
    authInfo: authInfo,
    experience: _.find(state.datastore.experiences, { name: experienceName }),
    experiences: lookupExperiences(state, { match: { params: { orgName: orgName } } }),
    org: authInfo ? _.find(authInfo.orgs, { name: orgName }) : null,
    groupId: groupId,
    groups: lookupGroups(state, { match: { params: { experienceName: experienceName } } })
  };
};

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Frame);
