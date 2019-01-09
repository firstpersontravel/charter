import { connect } from 'react-redux';

import { lookupDirections, lookupGroup } from './utils';
import GroupOverview from '../components/GroupOverview';

const mapStateToProps = (state, ownProps) => ({
  group: lookupGroup(state, ownProps),
  directions: lookupDirections(state, ownProps)
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(GroupOverview);
