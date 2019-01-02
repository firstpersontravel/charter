import _ from 'lodash';
import { connect } from 'react-redux';

import { assembleGroupStatus } from '../../connector-utils';
import { getMessagesNeedingReply } from '../utils';
import RoleMessages from '../components/RoleMessages';

const mapStateToProps = (state, ownProps) => {
  const groupStatus = assembleGroupStatus(state, ownProps.params.groupId);
  const user = _.find(state.datastore.users,
    { id: Number(ownProps.params.userId) });
  const messagesNeedingReply = getMessagesNeedingReply(
    state, ownProps.params.groupId, ownProps.params.roleName);
  return {
    groupStatus: groupStatus,
    user: user,
    messagesNeedingReply: messagesNeedingReply
  };
};

const mapDispatchToProps = dispatch => ({});


export default connect(mapStateToProps, mapDispatchToProps)(RoleMessages);
