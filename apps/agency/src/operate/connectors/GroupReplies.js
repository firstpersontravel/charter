import { connect } from 'react-redux';

import { lookupGroup, lookupMessages } from './utils';
import { updateInstance } from '../../actions';
import GroupReplies from '../components/GroupReplies';

const mapStateToProps = (state, ownProps) => ({
  group: lookupGroup(state, ownProps),
  messages: lookupMessages(state, ownProps, 30)
});

const mapDispatchToProps = dispatch => ({
  updateInstance: (...args) => dispatch(updateInstance(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(GroupReplies);
