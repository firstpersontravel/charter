import { connect } from 'react-redux';

import { assembleGroupStatus } from '../../connector-utils';
import GroupOverview from '../components/GroupOverview';

const mapStateToProps = (state, ownProps) => ({
  groupStatus: assembleGroupStatus(state, ownProps.params.groupId)
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(GroupOverview);
