import { connect } from 'react-redux';

import { lookupGroup, lookupMessages } from './utils';
import { updateInstance } from '../../actions';
import GroupMessages from '../components/GroupMessages';

const mapStateToProps = (state, ownProps) => ({
  group: lookupGroup(state, ownProps),
  messages: lookupMessages(state, ownProps, 30, {
    isReplyNeeded: true,
    replyReceivedAt: null
  })
});

const mapDispatchToProps = dispatch => ({
  updateInstance: (...args) => dispatch(updateInstance(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(GroupMessages);
