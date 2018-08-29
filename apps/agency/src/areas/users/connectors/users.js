import { connect } from 'react-redux';

import Users from '../components/users';

const mapStateToProps = (state, ownProps) => ({
  scripts: state.datastore.scripts,
  profiles: state.datastore.profiles
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Users);
