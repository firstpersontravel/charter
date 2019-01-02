import { connect } from 'react-redux';

import { assemblePlayerStatus } from '../../connector-utils';
import PlayerInterface from '../components/PlayerInterface';

const mapStateToProps = (state, ownProps) => ({
  player: assemblePlayerStatus(state, ownProps.params.tripId,
    ownProps.params.roleName).instance
});

export default connect(mapStateToProps)(PlayerInterface);
