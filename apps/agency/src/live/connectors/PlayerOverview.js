import { connect } from 'react-redux';

import { assemblePlayerStatus } from '../../connector-utils';
import PlayerOverview from '../components/PlayerOverview';

const mapStateToProps = (state, ownProps) => ({
  player: assemblePlayerStatus(state, ownProps.params.tripId,
    ownProps.params.roleName).instance
});

export default connect(mapStateToProps)(PlayerOverview);
