import { connect } from 'react-redux';

import { assembleParticipantStatus, instanceStatus } from '../../../connector-utils';
import Player from '../components/Player';

const mapStateToProps = (state, ownProps) => ({
  groupStatus: instanceStatus(state, 'groups',
    { id: Number(ownProps.params.groupId) }),
  participantStatus: assembleParticipantStatus(state, ownProps.params.tripId,
    ownProps.params.roleName)
});

export default connect(mapStateToProps)(Player);
