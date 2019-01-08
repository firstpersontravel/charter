import { connect } from 'react-redux';

import { lookupGroup } from './utils';
import GroupOverview from '../components/GroupOverview';

const mapStateToProps = (state, ownProps) => ({
  group: lookupGroup(state, ownProps)
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(GroupOverview);
