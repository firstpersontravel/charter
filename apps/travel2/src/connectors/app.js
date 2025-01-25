import { connect } from 'react-redux';

import App from '../components/app';
import { refreshData } from '../actions';

function getInterface(state, ownProps) {
  if (!state.trip) {
    return null;
  }
  const playerId = ownProps.match.params.playerId;
  const player = state.players.find(p => p.id === playerId);
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
    interface: getInterface(state, ownProps)
  };
}

const mapDispatchToProps = dispatch => ({
  refreshData: (...args) => dispatch(refreshData(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
