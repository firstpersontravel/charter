import { connect } from 'react-redux';

import { listCollection, postAction, updateInstance } from '../../actions';
import { lookupPlayer, lookupMessages } from './utils';
import PlayerMessages from '../components/PlayerMessages';

const mapStateToProps = (state, ownProps) => ({
  messages: lookupMessages(state, ownProps),
  player: lookupPlayer(state, ownProps)
});

const mapDispatchToProps = dispatch => ({
  listCollection: (...args) => dispatch(listCollection(...args)),
  updateInstance: (...args) => dispatch(updateInstance(...args)),
  postAction: (...args) => dispatch(postAction(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(PlayerMessages);
