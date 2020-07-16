import _ from 'lodash';
import { connect } from 'react-redux';

import Role from '../components/Role';

const mapStateToProps = (state, ownProps) => ({
  participant: ownProps.match.params.participantId !== '0' ?
    _.find(state.datastore.participants,
      { id: Number(ownProps.match.params.participantId) }) : null
});

const mapDispatchToProps = dispatch => ({});


export default connect(mapStateToProps, mapDispatchToProps)(Role);
