import { connect } from 'react-redux';

import { lookupDirections, lookupGroup, lookupLogEntries } from './utils';
import GroupOverview from '../components/GroupOverview';

const mapStateToProps = (state, ownProps) => ({
  group: lookupGroup(state, ownProps),
  logEntries: lookupLogEntries(state, ownProps),
  directions: lookupDirections(state, ownProps)
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(GroupOverview);
