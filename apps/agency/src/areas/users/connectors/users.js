import _ from 'lodash';
import { connect } from 'react-redux';

import Users from '../components/users';

const mapStateToProps = (state, ownProps) => ({
  scripts: _.filter(state.datastore.scripts, { isArchived: false }),
  profiles: state.datastore.profiles
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Users);
