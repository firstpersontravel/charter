import _ from 'lodash';
import { connect } from 'react-redux';

import { assembleParticipantStatus } from '../../../connector-utils';
import RoleIndex from '../components/RoleIndex';

const mapStateToProps = (state, ownProps) => {
  const userId = ownProps.params.userId !== '0' ?
    Number(ownProps.params.userId) : null;
  const user = userId ? _.find(state.datastore.users, { id: userId }) : null;
  const participants = _.filter(state.datastore.participants,
    { roleName: ownProps.params.roleName, userId: userId });
  const participantStatuses = participants
    .map(participant => (
      assembleParticipantStatus(state, participant.playthroughId,
        participant.roleName)
    ))
    .filter(participantStatus => !_.get(participantStatus,
      'instance.trip.isArchived'));
  return {
    user: user,
    participants: _.map(participantStatuses, 'instance')
  };
};

const mapDispatchToProps = dispatch => ({});


export default connect(mapStateToProps, mapDispatchToProps)(RoleIndex);
