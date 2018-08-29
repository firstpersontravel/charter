import _ from 'lodash';
import { connect } from 'react-redux';

import { assembleGroupStatus } from '../../../connector-utils';
import RoleInterface from '../components/RoleInterface';

const mapStateToProps = (state, ownProps) => {
  const groupStatus = assembleGroupStatus(state, ownProps.params.groupId);
  const userId = ownProps.params.userId !== '0' ?
    Number(ownProps.params.userId) : null;
  const user = userId ? _.find(state.datastore.users, { id: userId }) : null;
  return {
    groupStatus: groupStatus,
    roleName: ownProps.params.roleName,
    user: user
  };
};

export default connect(mapStateToProps)(RoleInterface);
