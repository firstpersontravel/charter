import { connect } from 'react-redux';

import { lookupMessages } from './utils';
import { updateInstance } from '../../actions';
import ActiveTripsMessages from '../components/ActiveTripsMessages';

const mapStateToProps = (state, ownProps) => ({
  messages: lookupMessages(state, ownProps, 30, {
    isReplyNeeded: true,
    replyReceivedAt: null
  })
});

const mapDispatchToProps = dispatch => ({
  updateInstance: (...args) => dispatch(updateInstance(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(ActiveTripsMessages);
