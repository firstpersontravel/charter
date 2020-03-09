import { connect } from 'react-redux';

import { listCollection, postAction, updateInstance } from '../../actions';
import { lookupTrip, lookupMessages } from './utils';
import TripMessages from '../components/TripMessages';

const mapStateToProps = (state, ownProps) => ({
  trip: lookupTrip(state, ownProps),
  messages: lookupMessages(state, ownProps)
    .filter((message) => {
      if (ownProps.location.query.for) {
        if (ownProps.location.query.for !== message.sentBy.roleName &&
            ownProps.location.query.for !== message.sentTo.roleName) {
          return false;
        }
      }
      if (ownProps.location.query.with) {
        if (ownProps.location.query.with !== message.sentBy.roleName &&
            ownProps.location.query.with !== message.sentTo.roleName) {
          return false;
        }
      }
      return true;
    })
});

const mapDispatchToProps = dispatch => ({
  listCollection: (...args) => dispatch(listCollection(...args)),
  updateInstance: (...args) => dispatch(updateInstance(...args)),
  postAction: (...args) => dispatch(postAction(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(TripMessages);
