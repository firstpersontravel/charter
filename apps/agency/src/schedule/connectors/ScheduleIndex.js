import { connect } from 'react-redux';

import ScheduleIndex from '../components/ScheduleIndex';

const mapStateToProps = (state, ownProps) => ({
  groups: state.datastore.groups
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(ScheduleIndex);
