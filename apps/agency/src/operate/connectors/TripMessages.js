import { connect } from 'react-redux';

import { listCollection, postAction, updateInstance } from '../../actions';
import { lookupTrip, lookupMessages } from './utils';
import TripMessages from '../components/TripMessages';

const mapStateToProps = (state, ownProps) => ({
  trip: lookupTrip(state, ownProps),
  messages: lookupMessages(state, ownProps)
    .filter((message) => {
      const query = new URLSearchParams(ownProps.location.search);
      const forRoleName = query.get('for');
      const withRoleName = query.get('with');
      if (forRoleName) {
        if (forRoleName !== message.sentBy.roleName &&
            forRoleName !== message.sentTo.roleName) {
          return false;
        }
      }
      if (withRoleName) {
        if (withRoleName !== message.sentBy.roleName &&
            withRoleName !== message.sentTo.roleName) {
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
