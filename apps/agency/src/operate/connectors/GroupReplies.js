import { connect } from 'react-redux';

import { lookupGroup } from './utils';
import { getMessagesNeedingReply } from '../utils';
import { updateInstance } from '../../actions';
import GroupReplies from '../components/GroupReplies';

const mapStateToProps = (state, ownProps) => ({
  group: lookupGroup(state, ownProps),
  messagesNeedingReply: getMessagesNeedingReply(state, ownProps.params.groupId)
});

const mapDispatchToProps = dispatch => ({
  updateInstance: (...args) => dispatch(updateInstance(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(GroupReplies);
