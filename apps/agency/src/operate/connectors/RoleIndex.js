import _ from 'lodash';
import { connect } from 'react-redux';

import RoleIndex from '../components/RoleIndex';
import { lookupPlayersByRole } from './utils';

const mapStateToProps = (state, ownProps) => {
  const participantId = ownProps.match.params.participantId !== '0' ?
    Number(ownProps.match.params.participantId) : null;
  const participant = participantId ?
    _.find(state.datastore.participants, { id: participantId }) :
    null;
  return {
    participant: participant,
    players: lookupPlayersByRole(state, ownProps)
  };
};

const mapDispatchToProps = dispatch => ({});


export default connect(mapStateToProps, mapDispatchToProps)(RoleIndex);
