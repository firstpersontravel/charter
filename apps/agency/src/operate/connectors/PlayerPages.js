import { connect } from 'react-redux';

import { lookupPlayer } from './utils';
import PlayerPages from '../components/PlayerPages';

const mapStateToProps = (state, ownProps) => ({
  player: lookupPlayer(state, ownProps)
});

const mapDispatchToProps = dispatch => ({});


export default connect(mapStateToProps, mapDispatchToProps)(PlayerPages);
