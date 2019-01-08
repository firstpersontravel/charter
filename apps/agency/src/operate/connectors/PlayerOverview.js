import { connect } from 'react-redux';

import { lookupPlayer } from './utils';
import PlayerOverview from '../components/PlayerOverview';

const mapStateToProps = (state, ownProps) => ({
  player: lookupPlayer(state, ownProps)
});

export default connect(mapStateToProps)(PlayerOverview);
