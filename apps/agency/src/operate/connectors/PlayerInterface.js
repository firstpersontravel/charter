import { connect } from 'react-redux';

import { lookupPlayer } from './utils';
import PlayerInterface from '../components/PlayerInterface';

const mapStateToProps = (state, ownProps) => ({
  player: lookupPlayer(state, ownProps)
});

export default connect(mapStateToProps)(PlayerInterface);
