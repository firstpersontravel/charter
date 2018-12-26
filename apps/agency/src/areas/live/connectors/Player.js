import { connect } from 'react-redux';

import { assemblePlayerStatus, instanceStatus } from '../../../connector-utils';
import Player from '../components/Player';

const mapStateToProps = (state, ownProps) => ({
  groupStatus: instanceStatus(state, 'groups',
    { id: Number(ownProps.params.groupId) }),
  playerStatus: assemblePlayerStatus(state, ownProps.params.tripId,
    ownProps.params.roleName)
});

export default connect(mapStateToProps)(Player);
