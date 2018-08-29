import { connect } from 'react-redux';

import { assembleParticipantStatus } from '../../../connector-utils';
import PlayerOverview from '../components/PlayerOverview';

const mapStateToProps = (state, ownProps) => ({
  participant: assembleParticipantStatus(state, ownProps.params.tripId,
    ownProps.params.roleName).instance
});

export default connect(mapStateToProps)(PlayerOverview);
