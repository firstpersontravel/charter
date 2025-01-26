import { connect } from 'react-redux';

import App from '../components/app';
import Evaluator from '../util/evaluator';
import { loadData, fireEvent } from '../actions';

function getPlayer(state, ownProps) {
  if (!state.players) {
    return null;
  }
  return state.players.find(p => p.id === Number(ownProps.match.params.playerId));
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
  const role = (script.content.roles || []).find(r => r.name === player.roleName);
  if (!role) {
    return null;
  }
  const iface = (script.content.interfaces || []).find(i => i.name === role.interface);
  return iface;
}

function mapStateToProps(state, ownProps) {
  return {
    experience: state.experience,
    trip: state.trip,
    script: state.script,
    player: getPlayer(state, ownProps),
    evaluator: new Evaluator(state, Number(ownProps.match.params.playerId)),
    iface: getInterface(state, ownProps)
  };
}

const mapDispatchToProps = {
  loadData,
  fireEvent
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
