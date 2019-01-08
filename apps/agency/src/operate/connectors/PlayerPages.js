import { connect } from 'react-redux';

import { postAction } from '../../actions';
import { lookupPlayer } from './utils';
import PlayerPages from '../components/PlayerPages';

const mapStateToProps = (state, ownProps) => ({
  player: lookupPlayer(state, ownProps)
});

const mapDispatchToProps = dispatch => ({
  postAction: (...args) => dispatch(postAction(...args))
});


export default connect(mapStateToProps, mapDispatchToProps)(PlayerPages);
