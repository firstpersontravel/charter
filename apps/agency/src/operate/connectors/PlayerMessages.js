import _ from 'lodash';
import { connect } from 'react-redux';

import { listCollection, postAction, updateInstance } from '../../actions';
import { lookupPlayer } from './utils';
import PlayerMessages from '../components/PlayerMessages';

const mapStateToProps = (state, ownProps) => ({
  messages: _.filter(state.datastore.messages, (message) => {
    if (message.tripId !== Number(ownProps.params.tripId)) {
      return false;
    }
    const sentBy = _.find(state.datastore.players,
      { id: message.sentById });
    const sentTo = _.find(state.datastore.players,
      { id: message.sentToId });
    if (ownProps.params.roleName === sentBy.roleName) {
      if (ownProps.params.withRoleName === 'All' ||
          ownProps.params.withRoleName === sentTo.roleName) {
        return true;
      }
    }
    if (ownProps.params.roleName === sentTo.roleName) {
      if (ownProps.params.withRoleName === 'All' ||
          ownProps.params.withRoleName === sentBy.roleName) {
        return true;
      }
    }
    return false;
  }),
  player: lookupPlayer(state, ownProps)
});

const mapDispatchToProps = dispatch => ({
  listCollection: (...args) => dispatch(listCollection(...args)),
  updateInstance: (...args) => dispatch(updateInstance(...args)),
  postAction: (...args) => dispatch(postAction(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(PlayerMessages);
