import _ from 'lodash';
import { connect } from 'react-redux';

import Users from '../components/users';

const mapStateToProps = (state, ownProps) => ({
  experiences: _.filter(state.datastore.experiences, { isArchived: false }),
  profiles: state.datastore.profiles
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Users);
