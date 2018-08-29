import { connect } from 'react-redux';

import { postAction } from '../../../actions';
import { assembleParticipantStatus } from '../../../connector-utils';
import PlayerPages from '../components/PlayerPages';

const mapStateToProps = (state, ownProps) => ({
  participant: assembleParticipantStatus(state, ownProps.params.tripId,
    ownProps.params.roleName).instance
});

const mapDispatchToProps = dispatch => ({
  postAction: (...args) => dispatch(postAction(...args))
});


export default connect(mapStateToProps, mapDispatchToProps)(PlayerPages);
