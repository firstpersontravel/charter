import _ from 'lodash';
import { connect } from 'react-redux';

import { assembleGroupStatus } from '../../../connector-utils';
import Role from '../components/Role';

const mapStateToProps = (state, ownProps) => ({
  groupStatus: assembleGroupStatus(state, ownProps.params.groupId),
  user: ownProps.params.userId !== '0' ?
    _.find(state.datastore.users, { id: Number(ownProps.params.userId) }) :
    null
});

const mapDispatchToProps = dispatch => ({});


export default connect(mapStateToProps, mapDispatchToProps)(Role);
