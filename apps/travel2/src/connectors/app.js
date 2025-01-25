import { connect } from 'react-redux';

import App from '../components/app';
import Evaluator from '../util/evaluator';
import { refreshData } from '../actions';

function getPlayer(state, ownProps) {
  if (!state.players) {
    return null;
  }
  return state.players.find(p => p.id === ownProps.match.params.playerId);
}

function getInterface(state, ownProps) {
  if (!state.trip) {
    return null;
  }
  const player = getPlayer(state, ownProps);
  if (!player) {
    return null;
  }
  const script = state.script;
  const role = script.content.roles.find(r => r.name === player.role);
  return (script.content.interfaces || []).find(i => i.name === role.interface);
}

function mapStateToProps(state, ownProps) {
  return {
    trip: state.trip,
    experience: state.experience,
    player: getPlayer(state, ownProps),
    evaluator: new Evaluator(state, ownProps.match.params.playerId),
    interface: getInterface(state, ownProps)
  };
}

const mapDispatchToProps = dispatch => ({
  refreshData: (...args) => dispatch(refreshData(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
