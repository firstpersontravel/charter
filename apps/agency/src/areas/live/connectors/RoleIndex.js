import _ from 'lodash';
import { connect } from 'react-redux';

import { assemblePlayerStatus } from '../../../connector-utils';
import RoleIndex from '../components/RoleIndex';

const mapStateToProps = (state, ownProps) => {
  const userId = ownProps.params.userId !== '0' ?
    Number(ownProps.params.userId) : null;
  const user = userId ? _.find(state.datastore.users, { id: userId }) : null;
  const players = _.filter(state.datastore.players,
    { roleName: ownProps.params.roleName, userId: userId });
  const playerStatuses = players
    .map(player => (
      assemblePlayerStatus(state, player.tripId,
        player.roleName)
    ))
    .filter(playerStatus => !_.get(playerStatus,
      'instance.trip.isArchived'));
  return {
    user: user,
    players: _.map(playerStatuses, 'instance')
  };
};

const mapDispatchToProps = dispatch => ({});


export default connect(mapStateToProps, mapDispatchToProps)(RoleIndex);
