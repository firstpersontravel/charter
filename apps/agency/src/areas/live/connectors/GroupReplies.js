import { connect } from 'react-redux';

import { assembleGroupStatus } from '../../../connector-utils';
import { getMessagesNeedingReply } from '../utils';
import { updateInstance } from '../../../actions';
import GroupReplies from '../components/GroupReplies';

const mapStateToProps = (state, ownProps) => ({
  groupStatus: assembleGroupStatus(state, ownProps.params.groupId),
  messagesNeedingReply: getMessagesNeedingReply(state, ownProps.params.groupId)
});

const mapDispatchToProps = dispatch => ({
  updateInstance: (...args) => dispatch(updateInstance(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(GroupReplies);
