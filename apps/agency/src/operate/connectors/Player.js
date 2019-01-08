import { connect } from 'react-redux';

import { lookupPlayer } from './utils';
import Player from '../components/Player';

const mapStateToProps = (state, ownProps) => ({
  player: lookupPlayer(state, ownProps)
});

export default connect(mapStateToProps)(Player);
